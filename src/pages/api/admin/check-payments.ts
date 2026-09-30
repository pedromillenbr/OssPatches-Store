import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getAllOrdersFromSheet,
  getOrderFromSheet,
  updateOrderStatusInSheet,
} from '@/services/googleSheets';
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

  // Quem manda aqui é o controle interno: se a coluna Status já diz "Pago",
  // não há o que acertar. Lemos a planilha UMA vez e só perguntamos ao
  // Mercado Pago sobre os pedidos que continuam em aberto lá.
  const sheetOrders = await getAllOrdersFromSheet();
  const gatewayStatusByRef = new Map(sheetOrders.map((o) => [o.id, o.gatewayStatus]));

  // Não olhamos só o que está "aguardando pagamento": um pedido que a loja já
  // adiantou para "Em produção" no painel continua marcado como Pendente na
  // planilha, e é exatamente esse descompasso que precisa sumir.
  const { data: open, error } = await admin
    .from('orders')
    .select('order_ref')
    .in('status', ['pending', 'confirmed', 'processing'])
    .order('created_at', { ascending: false })
    .limit(MAX_ORDERS);

  if (error) {
    console.error('[check-payments]', error.message);
    return res.status(500).json({ error: 'Não foi possível ler os pedidos.' });
  }

  const pendentes = (open ?? [])
    .map((row) => row.order_ref as string)
    .filter((ref) => gatewayStatusByRef.get(ref) !== 'approved');

  let confirmed = 0;

  for (const orderRef of pendentes) {
    try {
      const paymentId = await findApprovedPayment(orderRef);
      if (!paymentId) continue;

      await updateOrderStatusInSheet(orderRef, 'approved', paymentId);
      await settlePixUse(orderRef);
      await markOrderPaidInDb(orderRef);
      confirmed += 1;

      // A planilha ainda não registrava o pagamento, então o e-mail de
      // confirmação nunca saiu — este é o momento de mandar.
      const existing = await getOrderFromSheet(orderRef);
      if (existing?.customer?.email) {
        sendPaymentConfirmedEmail(existing as Order).catch((err) =>
          console.error('[check-payments] e-mail:', err)
        );
      }
    } catch (err) {
      console.error(`[check-payments] ${orderRef}:`, err);
    }
  }

  console.log(`[check-payments] ${confirmed} de ${pendentes.length} confirmados`);
  return res.status(200).json({ checked: pendentes.length, confirmed });
}
