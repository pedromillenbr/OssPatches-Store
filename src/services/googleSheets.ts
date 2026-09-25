import { google } from 'googleapis';
import { CartItem, Order } from '@/types';
import { sanitizeSheetValue } from '@/lib/sanitize';

/** Masks CPF for LGPD compliance: "123.456.789-00" → "***.***.789-**" */
function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***';
  return `***.***.${ digits.slice(6, 9) }-**`;
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_NAME = 'Pedidos';

type RowContext = {
  order: Order;
  item: CartItem;
  customization: Record<string, unknown>;
};

type SheetColumn = {
  /** Identificador usado no código para achar a coluna sem contar posições. */
  key: string;
  /** Texto do cabeçalho na planilha. */
  header: string;
  value: (ctx: RowContext) => string | number;
};

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function money(value: number | undefined): number {
  return Math.round((value || 0) * 100) / 100;
}

/** "Patch 1: P · circulo · Diâm. 10cm | Patch 2: ..." para o Kit de Patches. */
function dimensionsOf(customization: Record<string, unknown>): string {
  if (Array.isArray(customization.items)) {
    return (customization.items as Record<string, unknown>[])
      .map((p, index) => `Patch ${index + 1}: ${text(p.size)} ${text(p.format)} ${text(p.dimensions)}`)
      .join(' | ');
  }
  return text(customization.dimensions);
}

/**
 * Definição única das colunas: o cabeçalho, a linha gravada e a leitura do
 * webhook saem todos daqui. Antes o código contava posições na mão (row[24]),
 * então mexer numa coluna da planilha quebrava o pagamento em silêncio.
 *
 * Para acrescentar um dado novo, adicione um item no fim desta lista — o
 * cabeçalho da planilha se ajusta sozinho no próximo pedido.
 */
const COLUMNS: SheetColumn[] = [
  // Pedido
  { key: 'id', header: 'ID Pedido', value: ({ order }) => order.id },
  { key: 'createdAt', header: 'Data', value: ({ order }) => order.createdAt },

  // Cliente
  { key: 'name', header: 'Nome', value: ({ order }) => order.customer.name },
  { key: 'email', header: 'Email', value: ({ order }) => order.customer.email },
  { key: 'phone', header: 'WhatsApp', value: ({ order }) => text(order.customer.phone) },
  { key: 'cpf', header: 'CPF', value: ({ order }) => (order.customer.cpf ? maskCpf(order.customer.cpf) : '') },

  // Entrega — sem rua e número não dá para postar o pedido
  { key: 'zipCode', header: 'CEP/ZIP', value: ({ order }) => text(order.address.zipCode || order.address.cep) },
  { key: 'street', header: 'Rua', value: ({ order }) => text(order.address.street) },
  { key: 'number', header: 'Número', value: ({ order }) => text(order.address.number) },
  { key: 'complement', header: 'Complemento', value: ({ order }) => text(order.address.complement) },
  { key: 'neighborhood', header: 'Bairro', value: ({ order }) => text(order.address.neighborhood) },
  { key: 'city', header: 'Cidade', value: ({ order }) => text(order.address.city) },
  { key: 'state', header: 'Estado', value: ({ order }) => text(order.address.state) },
  { key: 'country', header: 'País', value: ({ order }) => text(order.address.country) },
  { key: 'shipping', header: 'Método Envio', value: ({ order }) => order.shipping?.name || 'A calcular' },

  // Item — o que precisa ser produzido
  { key: 'product', header: 'Produto', value: ({ item }) => item.name },
  { key: 'category', header: 'Categoria', value: ({ item }) => item.category },
  { key: 'type', header: 'Tipo', value: ({ customization }) => text(customization.type) },
  { key: 'size', header: 'Tamanho', value: ({ customization }) => text(customization.size) },
  { key: 'format', header: 'Formato', value: ({ customization }) => text(customization.format) },
  { key: 'dimensions', header: 'Medidas', value: ({ customization }) => dimensionsOf(customization) },
  {
    key: 'quantity',
    header: 'Quantidade',
    value: ({ item, customization }) =>
      'quantity' in customization ? text(customization.quantity) : String(item.quantity),
  },
  { key: 'degree', header: 'Grau', value: ({ customization }) => text(customization.degree) },
  { key: 'embroideredName', header: 'Nome Bordado', value: ({ customization }) => text(customization.embroideredName) },
  { key: 'artwork', header: 'Arte (Patch)', value: ({ customization }) => text(customization.artworkFileName) },

  // Valores
  { key: 'unitPrice', header: 'Valor Unitário', value: ({ item }) => money(item.price) },
  { key: 'subtotal', header: 'Subtotal', value: ({ order }) => money(order.subtotal) },
  { key: 'shippingCost', header: 'Frete', value: ({ order }) => money(order.shippingCost) },
  { key: 'coupon', header: 'Cupom', value: ({ order }) => text(order.couponCode) },
  { key: 'discount', header: 'Desconto', value: ({ order }) => money(order.discountAmount) },
  { key: 'total', header: 'Total', value: ({ order }) => money(order.total) },
  { key: 'currency', header: 'Moeda', value: ({ order }) => order.currency },
  { key: 'paymentMethod', header: 'Pagamento', value: ({ order }) => order.payment.method },
  { key: 'status', header: 'Status', value: ({ order }) => order.status },
  { key: 'notes', header: 'Observações', value: ({ order }) => text(order.notes) },
];

const HEADERS = COLUMNS.map((column) => column.header);

/** Posição da coluna na planilha, pelo nome que usamos no código. */
function indexOf(key: string): number {
  const index = COLUMNS.findIndex((column) => column.key === key);
  if (index === -1) throw new Error(`[sheets] coluna desconhecida: ${key}`);
  return index;
}

/** 0 → "A", 25 → "Z", 26 → "AA" */
function columnLetter(index: number): string {
  let letter = '';
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

const LAST_COLUMN = columnLetter(COLUMNS.length - 1);
const FULL_RANGE = `${SHEET_NAME}!A:${LAST_COLUMN}`;

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

type SheetsClient = Awaited<ReturnType<typeof getSheetsClient>>;

async function getSheetsClient() {
  const auth = await getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Garante que a linha 1 bate com COLUMNS. Se alguém mexer no cabeçalho ou se
 * uma coluna nova entrar no código, a planilha se conserta sozinha no próximo
 * pedido — o dono da loja nunca precisa editar isso na mão.
 */
export async function ensureSheetHeaders(spreadsheetId: string, sheets?: SheetsClient): Promise<void> {
  const client = sheets || (await getSheetsClient());

  const existing = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${LAST_COLUMN}1`,
  });

  const current = existing.data.values?.[0] || [];
  const matches = HEADERS.every((header, index) => current[index] === header);
  if (matches) return;

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
  console.log('[sheets] cabeçalho atualizado');
}

export async function appendOrderToSheet(order: Order): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.warn('Google Sheets not configured — skipping sheet append');
    return;
  }

  try {
    const sheets = await getSheetsClient();
    await ensureSheetHeaders(spreadsheetId, sheets);

    // Flatten items into rows
    for (const item of order.items) {
      const customization = item.customization as unknown as Record<string, unknown>;
      const ctx: RowContext = { order, item, customization };

      const row = COLUMNS.map((column) => column.value(ctx)).map((cell) =>
        typeof cell === 'string' ? sanitizeSheetValue(cell) : cell
      );

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
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: FULL_RANGE,
    });

    const rows = response.data.values || [];
    const row = rows.find((r) => r[0] === orderId);
    if (!row) return null;

    /** Lê pelo nome da coluna, então reordenar a planilha não quebra nada. */
    const cell = (key: string): string => (row[indexOf(key)] as string | undefined) || '';

    // A coluna de status guarda o status cru do Mercado Pago (ex: "approved",
    // "pending"). Lemos ela de verdade para permitir idempotência no webhook.
    const rawStatus = cell('status') || 'pending';
    const country = cell('country') || 'Brasil';

    return {
      id: cell('id'),
      createdAt: cell('createdAt'),
      customer: {
        name: cell('name'),
        email: cell('email'),
        phone: cell('phone') || undefined,
        country,
        countryCode: country === 'Brasil' ? 'BR' : 'INT',
      },
      address: {
        street: cell('street'),
        number: cell('number'),
        complement: cell('complement') || undefined,
        neighborhood: cell('neighborhood') || undefined,
        city: cell('city'),
        state: cell('state'),
        country,
        countryCode: country === 'Brasil' ? 'BR' : 'INT',
        zipCode: cell('zipCode'),
      },
      shipping: cell('shipping')
        ? { id: '', name: cell('shipping'), company: '', price: 0, days: '' }
        : null,
      subtotal: parseFloat(cell('subtotal')) || parseFloat(cell('unitPrice')) || 0,
      shippingCost: parseFloat(cell('shippingCost')) || 0,
      total: parseFloat(cell('total')) || 0,
      currency: cell('currency') || 'BRL',
      items: [{ name: cell('product') } as never],
      payment: { method: (cell('paymentMethod') as never) || 'pix' },
      // Mapeia o status cru do MP para o status interno do pedido.
      status: rawStatus === 'approved' ? 'confirmed' : 'pending',
      // Status cru do gateway, usado para idempotência no webhook.
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
    const sheets = await getSheetsClient();

    // Read all rows to find the order
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: FULL_RANGE,
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

    const statusColumn = columnLetter(indexOf('status'));

    for (const rowIndex of rowIndexes) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!${statusColumn}${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[sanitizeSheetValue(status)]] },
      });
    }

    console.log(`[sheets] Updated ${rowIndexes.length} row(s) for order ${orderId} → ${status} (MP: ${mpPaymentId})`);
  } catch (error) {
    console.error('[sheets] Failed to update order status:', error);
  }
}
