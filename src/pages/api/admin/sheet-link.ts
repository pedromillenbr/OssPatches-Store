import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetLinkForOrder } from '@/services/googleSheets';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { ORDER_ID_REGEX } from '@/lib/checkoutGuards';
import { handleCors } from '@/lib/cors';

/**
 * Devolve o link que abre a planilha já na linha do pedido.
 *
 * Fica no servidor porque o endereço da planilha não pode ir para o navegador
 * de qualquer visitante — só o dono da loja pede, e só recebe o link do
 * pedido que pediu.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  const orderRef = typeof req.query.orderRef === 'string' ? req.query.orderRef.trim() : '';
  if (!ORDER_ID_REGEX.test(orderRef)) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }

  const url = await getSheetLinkForOrder(orderRef);
  return res.status(200).json({ url });
}
