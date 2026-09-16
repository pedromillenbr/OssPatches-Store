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
