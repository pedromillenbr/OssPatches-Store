import type { NextApiRequest, NextApiResponse } from 'next';
import { unsubscribeCart } from '@/lib/abandonedCart';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { handleCors } from '@/lib/cors';

/**
 * "Não quero mais receber." Exigido pela boa prática de e-mail (e o caminho
 * honesto pela LGPD): quem pede para sair, sai, sem precisar responder e-mail
 * nem falar com ninguém.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('cart-restore', req, res)) return;

  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return res.status(400).json({ error: 'Link inválido' });
  }

  const done = await unsubscribeCart(token);
  // Mesma resposta em qualquer caso: a pessoa não precisa saber se o token
  // existia, e o objetivo dela (não receber mais) está garantido de todo jeito.
  return res.status(200).json({ ok: done });
}
