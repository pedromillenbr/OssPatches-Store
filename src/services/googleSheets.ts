import { google } from 'googleapis';
import { Order } from '@/types';
import { sanitizeSheetValue } from '@/lib/sanitize';

/** Masks CPF for LGPD compliance: "123.456.789-00" → "***.***.789-**" */
function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***';
  return `***.***.${ digits.slice(6, 9) }-**`;
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_NAME = 'Pedidos';

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
  return auth;
}

export async function appendOrderToSheet(order: Order): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.warn('Google Sheets not configured — skipping sheet append');
    return;
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Flatten items into rows
    for (const item of order.items) {
      const customization = item.customization as unknown as Record<string, unknown>;

      const row = [
        order.id,
        order.createdAt,
        order.customer.name,
        order.customer.email,
        order.customer.phone || '',
        order.customer.cpf ? maskCpf(order.customer.cpf) : '',
        item.name,
        item.category,
        String(customization.type || ''),
        String(customization.size || ''),
        'degree' in customization ? String(customization.degree) : '',
        'embroideredName' in customization ? String(customization.embroideredName || '') : '',
        'format' in customization ? String(customization.format || '') : '',
        'quantity' in customization ? String(customization.quantity) : String(item.quantity),
        'artworkFileName' in customization ? String(customization.artworkFileName || '') : '',
        order.address.country,
        order.address.city,
        order.address.state || '',
        order.address.zipCode,
        order.shipping?.name || 'A calcular',
        Math.round(item.price * 100) / 100,
        Math.round(order.total * 100) / 100,
        order.currency,
        order.payment.method,
        order.status,
        order.notes || '',
        // Coluna nova, no fim da linha para não deslocar as que já existem.
        // No Kit as medidas ficam item a item, então juntamos os três numa linha só.
        Array.isArray(customization.items)
          ? (customization.items as Record<string, unknown>[])
              .map((p, index) => `Patch ${index + 1}: ${p.size} ${p.format} ${p.dimensions}`)
              .join(' | ')
          : String(customization.dimensions || ''),
      ].map((cell) => (typeof cell === 'string' ? sanitizeSheetValue(cell) : cell));

      // RAW: o Sheets grava o texto exatamente como veio, SEM interpretar
      // fórmulas. Com USER_ENTERED, um nome como "=IMAGE(...)" virava fórmula
      // e podia vazar dados de outros clientes ao abrir a planilha.
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      });
    }
  } catch (error) {
    console.error('Failed to append order to Google Sheets:', error);
    // Non-fatal — order still goes through
  }
}

export async function getOrderFromSheet(
  orderId: string
): Promise<(Partial<Order> & { gatewayStatus?: string }) | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return null;

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:Y`,
    });

    const rows = response.data.values || [];
    const row = rows.find((r) => r[0] === orderId);
    if (!row) return null;

    // Columns: 0=ID, 1=Date, 2=Name, 3=Email, 4=WhatsApp, 5=CPF, 6=Product,
    //          15=Country, 16=City, 17=State, 18=ZIP, 19=Shipping,
    //          20=ItemPrice, 21=Total, 22=Currency, 23=PaymentMethod, 24=Status(Y)
    // A coluna Y guarda o status cru do Mercado Pago (ex: "approved", "pending").
    // Lemos ela de verdade para permitir idempotência no webhook.
    const rawStatus = (row[24] as string | undefined) || 'pending';
    return {
      id: row[0],
      createdAt: row[1],
      customer: {
        name: row[2],
        email: row[3],
        phone: row[4] || undefined,
        country: row[15] || 'Brasil',
        countryCode: row[15] === 'Brasil' ? 'BR' : 'INT',
      },
      address: {
        street: '',
        number: '',
        city: row[16],
        state: row[17],
        country: row[15],
        countryCode: row[15] === 'Brasil' ? 'BR' : 'INT',
        zipCode: row[18],
      },
      shipping: row[19] ? { id: '', name: row[19], company: '', price: 0, days: '' } : null,
      subtotal: parseFloat(row[20]) || 0,
      shippingCost: 0,
      total: parseFloat(row[21]) || 0,
      currency: row[22] || 'BRL',
      items: [{ name: row[6] } as never],
      payment: { method: (row[23] as never) || 'pix' },
      // Mapeia o status cru do MP para o status interno do pedido.
      status: rawStatus === 'approved' ? 'confirmed' : 'pending',
      // Status cru do gateway (coluna Y), usado para idempotência no webhook.
      gatewayStatus: rawStatus,
    } as Partial<Order> & { gatewayStatus: string };
  } catch (error) {
    console.error('[sheets] Failed to get order:', error);
    return null;
  }
}

export async function updateOrderStatusInSheet(
  orderId: string,
  status: string,
  mpPaymentId: string
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return;

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Read all rows to find the order
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:Y`,
    });

    const rows = response.data.values || [];
    const rowIndexes: number[] = [];

    rows.forEach((row, index) => {
      if (row[0] === orderId) rowIndexes.push(index + 1); // 1-based
    });

    if (rowIndexes.length === 0) {
      console.warn(`[sheets] Order ${orderId} not found in sheet`);
      return;
    }

    // Update status (col Y = index 24) and add MP payment ID note
    for (const rowIndex of rowIndexes) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!Y${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[sanitizeSheetValue(status)]] },
      });
    }

    console.log(`[sheets] Updated ${rowIndexes.length} row(s) for order ${orderId} → ${status} (MP: ${mpPaymentId})`);
  } catch (error) {
    console.error('[sheets] Failed to update order status:', error);
  }
}

export async function ensureSheetHeaders(spreadsheetId: string): Promise<void> {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const headers = [
    'ID Pedido', 'Data', 'Nome', 'Email', 'WhatsApp', 'CPF',
    'Produto', 'Categoria', 'Tipo', 'Tamanho', 'Grau',
    'Nome Bordado', 'Formato', 'Quantidade', 'Arte (Patch)',
    'País', 'Cidade', 'Estado', 'CEP/ZIP',
    'Método Envio', 'Valor Produto', 'Total', 'Moeda',
    'Pagamento', 'Status', 'Observações',
  ];

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:Z1`,
  });

  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }
}
