import { google } from 'googleapis';
import { Order } from '@/types';

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
        order.customer.cpf || order.customer.phone || '',
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
        item.price.toFixed(2),
        order.total.toFixed(2),
        order.currency,
        order.payment.method,
        order.status,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    }
  } catch (error) {
    console.error('Failed to append order to Google Sheets:', error);
    // Non-fatal — order still goes through
  }
}

export async function ensureSheetHeaders(spreadsheetId: string): Promise<void> {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const headers = [
    'ID Pedido', 'Data', 'Nome', 'Email', 'CPF/Telefone',
    'Produto', 'Categoria', 'Tipo', 'Tamanho', 'Grau',
    'Nome Bordado', 'Formato', 'Quantidade', 'Arte (Patch)',
    'País', 'Cidade', 'Estado', 'CEP/ZIP',
    'Método Envio', 'Valor Produto', 'Total', 'Moeda',
    'Pagamento', 'Status',
  ];

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:X1`,
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
