import crypto from 'crypto';
import { updateOrderStatusInSheet, getOrderFromSheet } from '@/services/googleSheets';
import { sendPaymentConfirmedEmail } from '@/services/email';
import { settlePixUse } from '@/lib/couponUsage';
import { markOrderPaidInDb } from '@/lib/orderPaymentSync';
import { sendPurchaseToMeta } from '@/lib/metaCapi';
import { CONFIG } from '@/config';
import type { Order } from '@/types';

/**
 * Aplica o status de um pagamento do Mercado Pago ao pedido: planilha,
 * cupom, conta do cliente, e-mail de confirmação e Purchase da Meta.
 *
 * Chamado pelo webhook e também pela consulta de status que a tela do
 * cliente faz enquanto espera o Pix — se o aviso do gateway não chegar, o
 * pedido vira "pago" no momento em que a tela do cliente percebe.
 *
 * `status` e `orderId` precisam vir da API do Mercado Pago (consultada com o
 * nosso token), nunca do corpo de uma requisição.
 */
export async function applyPaymentStatus(
  orderId: string,
  status: string,
  paymentId: string
): Promise<void> {
  // O mesmo pagamento chega aqui várias vezes (reentregas do webhook, a tela
  // do cliente consultando). Lemos o pedido ANTES de atualizar para disparar
  // e-mail e Meta só na primeira vez que ele vira "approved".
  const existingOrder = await getOrderFromSheet(orderId);
  // gatewayStatus é o status cru do MP gravado na planilha.
  const wasAlreadyApproved = existingOrder?.gatewayStatus === 'approved';

  // Nada mudou: a tela do cliente consulta a cada poucos segundos e não
  // precisa reescrever a planilha toda vez.
  if (wasAlreadyApproved && status === 'approved') return;

  await updateOrderStatusInSheet(orderId, status, paymentId);

  if (status !== 'approved') return;

  // A reserva do cupom vira uso de verdade. O settlePixUse apaga a reserva
  // antes de contar, então repetições não contam o mesmo pedido duas vezes.
  await settlePixUse(orderId);

  // Sem esta linha o cliente logado continuaria vendo "Aguardando pagamento".
  await markOrderPaidInDb(orderId);

  if (existingOrder?.customer?.email) {
    sendPaymentConfirmedEmail(existingOrder as Order).catch((err) =>
      console.error('[paymentSync] Email error:', err)
    );
  }

  // Purchase para a Meta pela API de Conversões. O `event_id` é o número do
  // pedido, o mesmo que o navegador usa, então a Meta descarta a cópia.
  if (existingOrder) {
    sendPurchaseToMeta(existingOrder as Order).catch((err) =>
      console.error('[paymentSync] Meta CAPI error:', err)
    );
  }
}

/**
 * Chave que vai na URL de aviso de cada pagamento. Os avisos pedidos por
 * `notification_url` nem sempre trazem a assinatura `x-signature` do painel,
 * então o webhook confere esta chave no lugar dela.
 */
export function notificationKey(): string | null {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update('notification_url').digest('hex').slice(0, 32);
}

/** URL que o Mercado Pago chama quando o status do pagamento muda. */
export function paymentNotificationUrl(): string | undefined {
  const key = notificationKey();
  if (!key) return undefined;
  // O Mercado Pago recusa URL que não seja https público (ex.: localhost).
  if (!CONFIG.siteUrl.startsWith('https://')) return undefined;
  return `${CONFIG.siteUrl.replace(/\/$/, '')}/api/webhooks/mercadopago?key=${key}`;
}
