export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Pagamento confirmado',
  processing: 'Em produção',
  shipped: 'Enviado',
  delivered: 'Entregue',
};

// Cor do badge por status — mantém a paleta sóbria da marca, um acento por estado.
export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-brand-gray-100 text-brand-gray-700',
  confirmed: 'bg-amber-50 text-amber-700',
  processing: 'bg-amber-100 text-amber-800',
  shipped: 'bg-brand-black text-white',
  delivered: 'bg-emerald-50 text-emerald-700',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
}

export function orderStatusClass(status: string): string {
  return ORDER_STATUS_CLASS[status as OrderStatus] ?? 'bg-brand-gray-100 text-brand-gray-700';
}

// ─── Linha do tempo ─────────────────────────────────────────────
// Etapas visíveis para o cliente acompanhar. "pending" = nenhuma concluída.
export interface TimelineStep {
  key: OrderStatus;
  label: string;
}

export const ORDER_TIMELINE: TimelineStep[] = [
  { key: 'confirmed', label: 'Pago' },
  { key: 'processing', label: 'Em produção' },
  { key: 'shipped', label: 'Enviado' },
  { key: 'delivered', label: 'Entregue' },
];

const RANK: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

/** Índice da etapa atual na ORDER_TIMELINE (-1 se ainda aguardando pagamento). */
export function timelineIndex(status: string): number {
  const rank = RANK[status as OrderStatus] ?? 0;
  return rank - 1; // confirmed(1) → 0, delivered(4) → 3
}

/** Todos os status possíveis, para o painel de admin. */
export const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];
