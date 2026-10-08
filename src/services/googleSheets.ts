import { google } from 'googleapis';
import { CartItem, Order } from '@/types';
import { sanitizeSheetValue } from '@/lib/sanitize';
import { ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { formatCPF } from '@/lib/cpf';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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
  /** Quando presente, a coluna vira menu suspenso na planilha. */
  options?: string[];
  value: (ctx: RowContext) => string | number;
};

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function money(value: number | undefined): number {
  return Math.round((value || 0) * 100) / 100;
}

// ─── Tradução dos códigos internos para o que o dono da loja lê ──────────────

/**
 * O webhook do Mercado Pago grava o status cru do pagamento nesta mesma coluna
 * e depois lê de volta para não mandar o e-mail de confirmação duas vezes.
 * Por isso a tradução precisa ter volta (STATUS_RAW).
 */
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_process: 'Pendente',
  in_mediation: 'Pendente',
  authorized: 'Pendente',
  approved: 'Pago',
  confirmed: 'Pago',
  processing: 'Em produção',
  shipped: 'Enviado',
  delivered: 'Entregue',
  rejected: 'Recusado',
  cancelled: 'Recusado',
  refunded: 'Estornado',
  charged_back: 'Estornado',
};

const STATUS_RAW: Record<string, string> = {
  Pendente: 'pending',
  Pago: 'approved',
  'Em produção': 'processing',
  Enviado: 'shipped',
  Entregue: 'delivered',
  Recusado: 'rejected',
  Estornado: 'refunded',
};

const STATUS_OPTIONS = ['Pendente', 'Pago', 'Em produção', 'Enviado', 'Entregue', 'Recusado', 'Estornado'];

/** Coluna preenchida à mão pelo dono da loja, fora do fluxo do pagamento. */
const SHIPPING_OPTIONS = ['A produzir', 'Em produção', 'Postado', 'A caminho', 'Entregue'];

export function statusLabel(raw: string): string {
  return STATUS_LABELS[raw] || raw;
}

function statusRaw(label: string): string {
  return STATUS_RAW[label] || label;
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  card: 'Cartão',
  credit_card: 'Cartão',
  paypal: 'PayPal',
};

const PAYMENT_RAW: Record<string, string> = { Pix: 'pix', 'Cartão': 'card', PayPal: 'paypal' };
const PAYMENT_OPTIONS = ['Pix', 'Cartão', 'PayPal'];

const FORMAT_LABELS: Record<string, string> = {
  circulo: 'Círculo',
  triangulo: 'Triângulo',
  retangulo: 'Retângulo',
  hexagonal: 'Hexágono',
  quadrado: 'Quadrado',
  personalizado: 'Personalizado',
};

const FORMAT_OPTIONS = Object.values(FORMAT_LABELS);

// ─── Leitura do que o cliente montou ─────────────────────────────────────────

function isKit(customization: Record<string, unknown>): boolean {
  return Array.isArray(customization.items);
}

function kitItems(customization: Record<string, unknown>): Record<string, unknown>[] {
  return (customization.items as Record<string, unknown>[]) || [];
}

/** "P" | "M" | "G" | "Kit" */
function patchSize(customization: Record<string, unknown>): string {
  return isKit(customization) ? 'Kit' : text(customization.size);
}

function patchFormat(customization: Record<string, unknown>): string {
  if (isKit(customization)) {
    return kitItems(customization)
      .map((p) => FORMAT_LABELS[text(p.format)] || text(p.format))
      .join(' | ');
  }
  const format = text(customization.format);
  return FORMAT_LABELS[format] || format;
}

/** "Diâm. 10cm" ou, no kit, "Patch 1: P Círculo Diâm. 10cm | Patch 2: ..." */
function patchDimensions(customization: Record<string, unknown>): string {
  if (isKit(customization)) {
    return kitItems(customization)
      .map(
        (p, index) =>
          `Patch ${index + 1}: ${text(p.size)} ${FORMAT_LABELS[text(p.format)] || text(p.format)} ${text(p.dimensions)}`
      )
      .join(' | ');
  }
  return text(customization.dimensions);
}

function patchArtwork(customization: Record<string, unknown>): string {
  if (isKit(customization)) {
    return kitItems(customization)
      .map((p) => text(p.artworkFileName))
      .filter(Boolean)
      .join(' | ');
  }
  return text(customization.artworkFileName);
}

const BELT_COLORS = [
  'Branca', 'Azul', 'Roxa', 'Marrom', 'Preta',
  'Vermelha', 'Vermelha e Preta', 'Vermelha e Branca',
  'Cinza', 'Amarela', 'Laranja', 'Verde',
];

/** "Faixa Vermelha e Preta - Adulto" → "Vermelha e Preta" */
function beltColor(item: CartItem): string {
  return item.name
    .replace(/^faixa\s+/i, '')
    .replace(/\s*[-–]\s*(adulto|infantil)\s*$/i, '')
    .trim();
}

/** A0–A2 existem nas duas linhas, então a linha precisa vir separada. */
function beltLine(item: CartItem): string {
  return item.category === 'belt-kids' ? 'Infantil' : 'Adulto';
}

const STRIPE_LABELS: Record<string, string> = {
  none: 'Sem ponteira',
  white: 'Branca',
  black: 'Preta',
};

/** O site mostra um apelido; a produção precisa do nome real da fonte. */
const EMBROIDERY_FONT_LABELS: Record<string, string> = {
  serifada: 'Brantford New',
  manuscrita: 'Brush Script',
};

const EMBROIDERY_COLOR_LABELS: Record<string, string> = {
  dourado: 'Dourado',
  branco: 'Branco',
};

// ─── Colunas ─────────────────────────────────────────────────────────────────

/** Cabeçalho comum: quem comprou e para onde vai. */
const IDENTIFICATION: SheetColumn[] = [
  { key: 'id', header: 'ID Pedido', value: ({ order }) => order.id },
  { key: 'createdAt', header: 'Data', value: ({ order }) => order.createdAt },
  { key: 'name', header: 'Nome', value: ({ order }) => order.customer.name },
  { key: 'phone', header: 'WhatsApp', value: ({ order }) => text(order.customer.phone) },
  // Sem o e-mail aqui, o webhook do Pix não tem para onde mandar o
  // "pagamento confirmado" quando o cliente paga horas depois.
  { key: 'email', header: 'Email', value: ({ order }) => order.customer.email },
  { key: 'zipCode', header: 'CEP', value: ({ order }) => text(order.address.zipCode || order.address.cep) },
  // O CEP leva até a rua, mas número e complemento só existem no pedido.
  { key: 'number', header: 'Número', value: ({ order }) => text(order.address.number) },
  { key: 'complement', header: 'Complemento', value: ({ order }) => text(order.address.complement) },
];

/** Fechamento comum: quantidade, dinheiro e situação. */
const CLOSING: SheetColumn[] = [
  { key: 'quantity', header: 'Quantidade', value: ({ item }) => item.quantity },
  { key: 'value', header: 'Valor', value: ({ item }) => money(item.price * item.quantity) },
  { key: 'total', header: 'Total', value: ({ order }) => money(order.total) },
  { key: 'currency', header: 'Moeda', value: ({ order }) => order.currency },
  {
    key: 'paymentMethod',
    header: 'Pagamento',
    options: PAYMENT_OPTIONS,
    value: ({ order }) => PAYMENT_LABELS[order.payment.method] || text(order.payment.method),
  },
  {
    key: 'status',
    header: 'Status',
    options: STATUS_OPTIONS,
    value: ({ order }) => statusLabel(order.status),
  },
  // Coluna do dono da loja: nasce vazia e o sistema nunca mais escreve nela.
  // Serve para acompanhar o envio sem mexer no Status, que o webhook lê.
  { key: 'shipping', header: 'Envio', options: SHIPPING_OPTIONS, value: () => '' },
  // Também preenchida à mão. É o que o cliente sem conta vê em /rastrear, e
  // por isso é o único jeito de dar rastreio a quem comprou como convidado
  // (pedido de convidado não existe no Banco de Dados). Aceita o código puro
  // ou a URL completa da transportadora — a página trata os dois casos.
  { key: 'tracking', header: 'Rastreio', value: () => '' },
  // Forma de envio escolhida pelo cliente no checkout. Fica por último de
  // propósito: o cabeçalho é reescrito pelo código, e acrescentar no fim não
  // desloca nada do que já está gravado nas linhas antigas.
  {
    key: 'carrier',
    header: 'Transportadora',
    value: ({ order }) => {
      if (!order.shipping) return '';
      const nome = [order.shipping.company, order.shipping.name].filter(Boolean).join(' ');
      const prazo = text(order.shipping.days);
      return prazo ? nome + ' - ' + prazo : nome;
    },
  },
  // Frete e desconto do pedido, separados do total. Sem isso não dá para
  // conferir quanto sobrou da venda nem o que foi pago à transportadora.
  { key: 'shippingCost', header: 'Frete', value: ({ order }) => money(order.shippingCost) },
  { key: 'discount', header: 'Desconto', value: ({ order }) => money(order.discountAmount ?? 0) },
  // CPF de quem comprou, para nota fiscal e etiqueta. Só pedidos do Brasil
  // têm. Também no fim, pelo mesmo motivo da Transportadora: não desloca as
  // linhas antigas.
  { key: 'cpf', header: 'CPF', value: ({ order }) => (order.customer.cpf ? formatCPF(order.customer.cpf) : '') },
];

const PATCH_COLUMNS: SheetColumn[] = [
  ...IDENTIFICATION,
  { key: 'size', header: 'Tamanho', options: ['P', 'M', 'G', 'Kit'], value: ({ customization }) => patchSize(customization) },
  { key: 'format', header: 'Formato', options: FORMAT_OPTIONS, value: ({ customization }) => patchFormat(customization) },
  { key: 'dimensions', header: 'Medidas', value: ({ customization }) => patchDimensions(customization) },
  { key: 'artwork', header: 'Arte', value: ({ customization }) => patchArtwork(customization) },
  ...CLOSING,
];

const BELT_COLUMNS: SheetColumn[] = [
  ...IDENTIFICATION,
  { key: 'line', header: 'Linha', options: ['Adulto', 'Infantil'], value: ({ item }) => beltLine(item) },
  { key: 'color', header: 'Coloração', options: BELT_COLORS, value: ({ item }) => beltColor(item) },
  {
    key: 'size',
    header: 'Tamanho',
    options: ['M1', 'M2', 'M3', 'M4', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
    value: ({ customization }) => text(customization.size),
  },
  {
    key: 'degree',
    header: 'Graus',
    options: ['0', '1', '2', '3', '4'],
    value: ({ customization }) => text(customization.degree ?? ''),
  },
  {
    key: 'finish',
    header: 'Acabamento',
    options: ['Simples', 'Bordada'],
    value: ({ customization }) => (customization.type === 'custom' ? 'Bordada' : 'Simples'),
  },
  { key: 'embroideredName', header: 'Nome Bordado', value: ({ customization }) => text(customization.embroideredName) },
  {
    key: 'nameFont',
    header: 'Fonte',
    options: Object.values(EMBROIDERY_FONT_LABELS),
    value: ({ customization }) => EMBROIDERY_FONT_LABELS[text(customization.nameFont)] || '',
  },
  {
    key: 'nameColor',
    header: 'Cor do Bordado',
    options: Object.values(EMBROIDERY_COLOR_LABELS),
    value: ({ customization }) => EMBROIDERY_COLOR_LABELS[text(customization.nameColor)] || '',
  },
  {
    key: 'stripe',
    header: 'Ponteira',
    options: Object.values(STRIPE_LABELS),
    value: ({ customization }) =>
      'stripe' in customization ? STRIPE_LABELS[text(customization.stripe)] || text(customization.stripe) : '',
  },
  ...CLOSING,
];

type SheetTab = {
  name: string;
  columns: SheetColumn[];
  /** Decide em qual aba cada item do pedido entra. */
  accepts: (item: CartItem) => boolean;
};

const TABS: SheetTab[] = [
  { name: 'Patches', columns: PATCH_COLUMNS, accepts: (item) => !String(item.category).startsWith('belt') },
  { name: 'Faixas', columns: BELT_COLUMNS, accepts: (item) => String(item.category).startsWith('belt') },
];

function tabFor(item: CartItem): SheetTab {
  return TABS.find((tab) => tab.accepts(item)) || TABS[0];
}

/**
 * Remonta o nome do produto a partir da linha da planilha. O e-mail de
 * "pagamento confirmado" é montado com o que está gravado aqui, então sem isso
 * o cliente receberia um e-mail dizendo só "Patches".
 */
function productNameFrom(tab: SheetTab, cell: (key: string) => string): string {
  if (tab.name === 'Faixas') {
    const color = cell('color');
    const line = cell('line');
    return ['Faixa', color, line && `- ${line}`].filter(Boolean).join(' ');
  }
  const size = cell('size');
  return size === 'Kit' ? 'Kit de Patches' : ['Patch', size].filter(Boolean).join(' ');
}

/** Posição da coluna na aba, pelo nome que usamos no código. */
function indexOf(tab: SheetTab, key: string): number {
  const index = tab.columns.findIndex((column) => column.key === key);
  if (index === -1) throw new Error(`[sheets] coluna desconhecida em ${tab.name}: ${key}`);
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

function fullRange(tab: SheetTab): string {
  return `${tab.name}!A:${columnLetter(tab.columns.length - 1)}`;
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

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

/** Roda uma vez por processo: sem isso seria uma leitura extra a cada pedido. */
let layoutChecked = false;

/**
 * Cria as abas que faltarem, acerta a linha do cabeçalho e aplica os menus
 * suspensos. Assim o dono da loja nunca precisa editar a planilha na mão — e
 * se alguém mexer sem querer, o próximo pedido conserta.
 */
export async function ensureSheetLayout(spreadsheetId: string, sheets?: SheetsClient): Promise<void> {
  const client = sheets || (await getSheetsClient());

  const meta = await client.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets || [];

  // 1. Abas que ainda não existem.
  const missing = TABS.filter(
    (tab) => !existing.some((sheet) => sheet.properties?.title === tab.name)
  );
  if (missing.length > 0) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((tab) => ({ addSheet: { properties: { title: tab.name } } })),
      },
    });
  }

  // 2. Cabeçalhos — reescritos só quando não batem com o código.
  const refreshed = missing.length > 0 ? await client.spreadsheets.get({ spreadsheetId }) : meta;
  const sheetIdByName = new Map<string, number>();
  const gridWidthByName = new Map<string, number>();
  (refreshed.data.sheets || []).forEach((sheet) => {
    const title = sheet.properties?.title;
    const id = sheet.properties?.sheetId;
    if (title && typeof id === 'number') sheetIdByName.set(title, id);
    if (title) gridWidthByName.set(title, sheet.properties?.gridProperties?.columnCount ?? 0);
  });

  for (const tab of TABS) {
    const headers = tab.columns.map((column) => column.header);
    const lastColumn = columnLetter(tab.columns.length - 1);

    // A aba pode ter menos colunas do que o código precisa (o Sheets não
    // alarga sozinho). Sem isto, gravar uma coluna nova dá erro de "fora da
    // grade" e o pedido inteiro deixa de entrar na planilha.
    const width = gridWidthByName.get(tab.name) ?? 0;
    const tabId = sheetIdByName.get(tab.name);
    if (tabId !== undefined && width > 0 && width < tab.columns.length) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              appendDimension: {
                sheetId: tabId,
                dimension: 'COLUMNS',
                length: tab.columns.length - width,
              },
            },
          ],
        },
      });
    }

    const current = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab.name}!A1:${lastColumn}1`,
    });
    const row = current.data.values?.[0] || [];
    const matches = headers.every((header, index) => row[index] === header);
    if (matches) continue;

    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab.name}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });

    // 3. Menus suspensos nas colunas de opção fixa.
    const sheetId = sheetIdByName.get(tab.name);
    if (sheetId === undefined) continue;

    const requests = tab.columns
      .map((column, index) =>
        column.options
          ? {
              setDataValidation: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  endRowIndex: 5000,
                  startColumnIndex: index,
                  endColumnIndex: index + 1,
                },
                rule: {
                  condition: {
                    type: 'ONE_OF_LIST',
                    values: column.options.map((option) => ({ userEnteredValue: option })),
                  },
                  showCustomUi: true,
                  // Não bloqueia valores fora da lista: se aparecer um status
                  // novo do gateway, ele ainda é gravado em vez de dar erro.
                  strict: false,
                },
              },
            }
          : null
      )
      .filter(Boolean);

    if (requests.length > 0) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: requests as never[] },
      });
    }
    console.log(`[sheets] aba "${tab.name}" ajustada`);
  }
}

export async function appendOrderToSheet(order: Order): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.warn('Google Sheets not configured — skipping sheet append');
    return;
  }

  try {
    const sheets = await getSheetsClient();
    if (!layoutChecked) {
      await ensureSheetLayout(spreadsheetId, sheets);
      layoutChecked = true;
    }

    // Cada item vira uma linha, na aba do seu tipo de produto.
    for (const item of order.items) {
      const customization = item.customization as unknown as Record<string, unknown>;
      const tab = tabFor(item);
      const ctx: RowContext = { order, item, customization };

      const row = tab.columns
        .map((column) => column.value(ctx))
        .map((cell) => (typeof cell === 'string' ? sanitizeSheetValue(cell) : cell));

      // RAW: o Sheets grava o texto exatamente como veio, SEM interpretar
      // fórmulas. Com USER_ENTERED, um nome como "=IMAGE(...)" virava fórmula
      // e podia vazar dados de outros clientes ao abrir a planilha.
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tab.name}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      });
    }
  } catch (error) {
    console.error('Failed to append order to Google Sheets:', error);
    // Non-fatal — order still goes through
  }
}

/** Campos que só existem na planilha, fora do tipo Order. */
export interface SheetOrderExtras {
  /** Status cru do gateway ('approved', 'pending'…), usado para idempotência. */
  gatewayStatus?: string;
  /** Coluna "Envio", preenchida à mão: 'Postado', 'A caminho'… */
  shippingStage?: string;
  /** Coluna "Rastreio": código da transportadora ou URL completa. */
  tracking?: string;
}

export async function getOrderFromSheet(
  orderId: string
): Promise<(Partial<Order> & SheetOrderExtras) | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return null;

  try {
    const sheets = await getSheetsClient();

    // O pedido pode estar em qualquer uma das abas — procuramos nas duas.
    for (const tab of TABS) {
      let rows: string[][];
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: fullRange(tab),
        });
        rows = (response.data.values as string[][]) || [];
      } catch {
        continue; // aba ainda não existe
      }

      const row = rows.find((r) => r[0] === orderId);
      if (!row) continue;

      /** Lê pelo nome da coluna, então reordenar a planilha não quebra nada. */
      const cell = (key: string): string => (row[indexOf(tab, key)] as string | undefined) || '';

      const rawStatus = statusRaw(cell('status')) || 'pending';
      const rawPayment = PAYMENT_RAW[cell('paymentMethod')] || cell('paymentMethod');

      return {
        id: cell('id'),
        createdAt: cell('createdAt'),
        customer: {
          name: cell('name'),
          email: cell('email'),
          phone: cell('phone') || undefined,
          country: 'Brasil',
          countryCode: 'BR',
        },
        address: {
          street: '',
          number: cell('number'),
          complement: cell('complement') || undefined,
          city: '',
          country: 'Brasil',
          countryCode: 'BR',
          zipCode: cell('zipCode'),
        },
        shipping: null,
        subtotal: parseFloat(cell('value')) || 0,
        shippingCost: 0,
        total: parseFloat(cell('total')) || 0,
        currency: cell('currency') || 'BRL',
        items: [{ name: productNameFrom(tab, cell) } as never],
        payment: { method: (rawPayment as never) || 'pix' },
        // Mapeia o status cru do MP para o status interno do pedido.
        status: rawStatus === 'approved' ? 'confirmed' : 'pending',
        // Status cru do gateway, usado para idempotência no webhook.
        gatewayStatus: rawStatus,
        // Colunas preenchidas à mão pelo dono, exibidas em /rastrear.
        shippingStage: cell('shipping'),
        tracking: cell('tracking'),
      } as Partial<Order> & SheetOrderExtras;
    }

    return null;
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
    const label = sanitizeSheetValue(statusLabel(status));
    let updated = 0;

    // O mesmo pedido pode ter linhas nas duas abas (patch + faixa no carrinho).
    for (const tab of TABS) {
      let rows: string[][];
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: fullRange(tab),
        });
        rows = (response.data.values as string[][]) || [];
      } catch {
        continue;
      }

      const statusColumn = columnLetter(indexOf(tab, 'status'));

      for (let index = 0; index < rows.length; index += 1) {
        if (rows[index][0] !== orderId) continue;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${tab.name}!${statusColumn}${index + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [[label]] },
        });
        updated += 1;
      }
    }

    if (updated === 0) {
      console.warn(`[sheets] Order ${orderId} not found in sheet`);
      return;
    }

    console.log(`[sheets] Updated ${updated} row(s) for order ${orderId} → ${label} (MP: ${mpPaymentId})`);
  } catch (error) {
    console.error('[sheets] Failed to update order status:', error);
  }
}

/** Pedido antigo, montado a partir das linhas da planilha. */
export interface SheetOrderSummary {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  /** Vazio nos pedidos anteriores à coluna existir e nos de fora do Brasil. */
  cpf: string;
  /** Forma de pagamento como está na planilha ('Pix', 'Cartão'…). */
  paymentMethod: string;
  /** Coluna "Transportadora", vazia nos pedidos anteriores à coluna existir. */
  carrier: string;
  /** O que a planilha guarda do endereço: CEP leva à rua, o resto não. */
  zipCode: string;
  number: string;
  complement: string;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  /** Status cru do gateway ('approved', 'pending'…). */
  gatewayStatus: string;
  shippingStage: string;
  tracking: string;
  items: { name: string; quantity: number; price: number; details: string }[];
}

/**
 * Junta as colunas de personalização numa linha só, para o painel mostrar o
 * que precisa ser produzido sem abrir a planilha.
 */
function itemDetailsFrom(tab: SheetTab, cell: (key: string) => string): string {
  const parts =
    tab.name === 'Faixas'
      ? [
          cell('size') && `Tamanho ${cell('size')}`,
          cell('degree') && `${cell('degree')} grau(s)`,
          cell('finish'),
          cell('embroideredName') && `Nome: ${cell('embroideredName')}`,
          cell('nameFont'),
          cell('nameColor') && `Bordado ${cell('nameColor')}`,
          cell('stripe') && `Ponteira ${cell('stripe')}`,
        ]
      : [
          cell('size') && `Tamanho ${cell('size')}`,
          cell('format'),
          cell('dimensions'),
          cell('artwork') && `Arte: ${cell('artwork')}`,
        ];

  return parts.filter(Boolean).join(' · ');
}

/**
 * Busca na planilha todos os pedidos feitos com um e-mail.
 *
 * Serve para recuperar pedidos antigos: enquanto o pedido só era gravado pelo
 * navegador na tela de sucesso, quem comprou como convidado (ou pagou o Pix no
 * app do banco e fechou a aba) ficou sem nada em "Meus pedidos". A planilha
 * tem tudo — daqui a gente traz de volta para a conta do cliente.
 *
 * Um pedido ocupa uma linha por item, e pode ter itens nas duas abas, então
 * agrupamos tudo pelo número do pedido.
 */
export async function getOrdersByEmailFromSheet(email: string): Promise<SheetOrderSummary[]> {
  const wanted = email.trim().toLowerCase();
  if (!wanted) return [];
  return readOrdersFromSheet(wanted);
}

/**
 * Todos os pedidos da planilha, para o painel do admin reconstruir a lista.
 */
export async function getAllOrdersFromSheet(): Promise<SheetOrderSummary[]> {
  return readOrdersFromSheet();
}

/** Lê a planilha inteira, opcionalmente só as linhas de um e-mail. */
async function readOrdersFromSheet(wanted?: string): Promise<SheetOrderSummary[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return [];

  try {
    const sheets = await getSheetsClient();
    const byId = new Map<string, SheetOrderSummary>();

    for (const tab of TABS) {
      let rows: string[][];
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: fullRange(tab),
        });
        rows = (response.data.values as string[][]) || [];
      } catch {
        continue; // aba ainda não existe
      }

      for (const row of rows) {
        const cell = (key: string): string =>
          (row[indexOf(tab, key)] as string | undefined) || '';

        if (wanted && cell('email').trim().toLowerCase() !== wanted) continue;

        // Descarta o cabeçalho e qualquer linha solta: só entra o que tem
        // cara de número de pedido.
        const id = cell('id').trim();
        if (!ORDER_ID_REGEX.test(id)) continue;

        const quantity = parseInt(cell('quantity'), 10) || 1;
        const lineValue = parseFloat(cell('value')) || 0;
        const item = {
          name: productNameFrom(tab, cell),
          quantity,
          price: Math.round((lineValue / quantity) * 100) / 100,
          details: itemDetailsFrom(tab, cell),
        };

        const existing = byId.get(id);
        if (existing) {
          existing.items.push(item);
          continue;
        }

        byId.set(id, {
          id,
          createdAt: cell('createdAt'),
          name: cell('name'),
          email: cell('email'),
          phone: cell('phone'),
          cpf: cell('cpf'),
          paymentMethod: cell('paymentMethod'),
          carrier: cell('carrier'),
          zipCode: cell('zipCode'),
          number: cell('number'),
          complement: cell('complement'),
          shippingCost: parseFloat(cell('shippingCost')) || 0,
          discountAmount: parseFloat(cell('discount')) || 0,
          total: parseFloat(cell('total')) || 0,
          currency: cell('currency') || 'BRL',
          gatewayStatus: statusRaw(cell('status')) || 'pending',
          shippingStage: cell('shipping'),
          tracking: cell('tracking'),
          items: [item],
        });
      }
    }

    return Array.from(byId.values());
  } catch (error) {
    console.error('[sheets] Falha ao buscar pedidos por e-mail:', error);
    return [];
  }
}

/** Status do painel → coluna "Envio" da planilha. */
const STATUS_TO_STAGE: Record<string, string> = {
  confirmed: 'A produzir',
  processing: 'Em produção',
  shipped: 'Postado',
  delivered: 'Entregue',
};

/**
 * Leva para a planilha o que a loja mudou no painel: etapa do envio e
 * rastreio.
 *
 * Existe porque as duas telas mostravam a mesma venda com informações
 * diferentes — o painel dizia "Em produção" e a planilha continuava vazia.
 * Quem edita no painel agora atualiza os dois lugares de uma vez.
 *
 * A coluna "Status" NÃO é tocada aqui: ela é do gateway, e é por ela que o
 * webhook sabe se já mandou o e-mail de pagamento confirmado.
 */
export async function updateOrderShippingInSheet(
  orderId: string,
  status: string,
  tracking: string
): Promise<number> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return 0;

  const stage = sanitizeSheetValue(STATUS_TO_STAGE[status] ?? '');
  const trackingValue = sanitizeSheetValue(tracking);
  let updated = 0;

  try {
    const sheets = await getSheetsClient();

    // O mesmo pedido pode ter linhas nas duas abas (patch + faixa no carrinho).
    for (const tab of TABS) {
      let rows: string[][];
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: fullRange(tab),
        });
        rows = (response.data.values as string[][]) || [];
      } catch {
        continue;
      }

      const shippingColumn = columnLetter(indexOf(tab, 'shipping'));
      const trackingColumn = columnLetter(indexOf(tab, 'tracking'));

      for (let index = 0; index < rows.length; index += 1) {
        if (rows[index][0] !== orderId) continue;
        const line = index + 1;

        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: [
              { range: `${tab.name}!${shippingColumn}${line}`, values: [[stage]] },
              { range: `${tab.name}!${trackingColumn}${line}`, values: [[trackingValue]] },
            ],
          },
        });
        updated += 1;
      }
    }

    if (updated === 0) console.warn(`[sheets] pedido ${orderId} não encontrado`);
    return updated;
  } catch (error) {
    console.error('[sheets] falha ao atualizar envio:', error);
    return 0;
  }
}

/**
 * Link que abre a planilha já na linha do pedido.
 *
 * Existe para não ter de procurar o número à mão quando o painel e a planilha
 * precisam ser comparados. Devolve null se o pedido não estiver lá.
 */
export async function getSheetLinkForOrder(orderId: string): Promise<string | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return null;

  try {
    const sheets = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });

    const gidByName = new Map<string, number>();
    (meta.data.sheets || []).forEach((sheet) => {
      const title = sheet.properties?.title;
      const id = sheet.properties?.sheetId;
      if (title && typeof id === 'number') gidByName.set(title, id);
    });

    for (const tab of TABS) {
      let rows: string[][];
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${tab.name}!A:A`,
        });
        rows = (response.data.values as string[][]) || [];
      } catch {
        continue;
      }

      const index = rows.findIndex((r) => r[0] === orderId);
      if (index === -1) continue;

      const gid = gidByName.get(tab.name);
      if (gid === undefined) continue;

      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}&range=A${index + 1}`;
    }

    return null;
  } catch (error) {
    console.error('[sheets] falha ao montar link do pedido:', error);
    return null;
  }
}
