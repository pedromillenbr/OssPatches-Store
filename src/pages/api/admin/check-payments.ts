import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrderFromSheet, updateOrderStatusInSheet } from '@/services/googleSheets';
import { sendPaymentConfirmedEmail } from '@/services/email';
import { markOrderPaidInDb } from '@/lib/orderPaymentSync';
import { settlePixUse } from '@/lib/couponUsage';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { handleCors } from '@/lib/cors';
import type { Order } from '@/types';

/**
 * Pergunta ao Mercado Pago, pedido por pedido, se o dinheiro entrou.
 *
 * Existe porque o aviso automático do gateway (o "webhook") pode não chegar:
 * configuração errada, instabilidade, ou a loja ainda não tê-lo cadastrado.
 * Quando isso acontece, o cliente paga e o pedido fica "Aguardando pagamento"
 * para sempre nos dois lugares. Este botão desempata perguntando na fonte.
 *
 * Só olha o que está pendente, e só sabe dizer "foi pago" — nada aqui recusa,
 * estorna ou mexe em pedido que já avançou.
 */

/** Teto por clique: consulta externa, não pode estourar o tempo da requisição. */
const MAX_ORDERS = 40;

async function findApprovedPayment(orderRef: string): Promise<string | null> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return null;

  const url =
    'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc' +
    `&external_reference=${encodeURIComponent(orderRef)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(`[check-payments] ${orderRef}: Mercado Pago retornou ${res.status}`);
    return null;
  }

  const data = await res.json();
  const approved = (data.results ?? []).find(
    (p: { status?: string }) => p.status === 'approved'
  );
  return approved ? String(approved.id) : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return res.status(503).json({ error: 'Mercado Pago não configurado no servidor.' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Banco de Dados não configurado no servidor.' });
  }

  const { data: pending, error } = await admin
    .from('orders')
    .select('order_ref')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(MAX_ORDERS);

  if (error) {
    console.error('[check-payments]', error.message);
    return res.status(500).json({ error: 'Não foi possível ler os pedidos.' });
  }

  let confirmed = 0;

  for (const row of pending ?? []) {
    const orderRef = row.order_ref as string;
    try {
      const paymentId = await findApprovedPayment(orderRef);
      if (!paymentId) continue;

      // Mesma proteção do aviso automático: só mandamos o e-mail de pagamento
      // confirmado se a planilha ainda não registrava o pedido como pago.
      const existing = await getOrderFromSheet(orderRef);
      const wasApproved = existing?.gatewayStatus === 'approved';

      await updateOrderStatusInSheet(orderRef, 'approved', paymentId);
      await settlePixUse(orderRef);
      await markOrderPaidInDb(orderRef);
      confirmed += 1;

      if (!wasApproved && existing?.customer?.email) {
        sendPaymentConfirmedEmail(existing as Order).catch((err) =>
          console.error('[check-payments] e-mail:', err)
        );
      }
    } catch (err) {
      console.error(`[check-payments] ${orderRef}:`, err);
    }
  }

  console.log(`[check-payments] ${confirmed} de ${pending?.length ?? 0} confirmados`);
  return res.status(200).json({ checked: pending?.length ?? 0, confirmed });
}
