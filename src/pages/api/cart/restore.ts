import type { NextApiRequest, NextApiResponse } from 'next';
import { getCartByToken } from '@/lib/abandonedCart';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { handleCors } from '@/lib/cors';

/**
 * Devolve o carrinho salvo a partir do token do link do e-mail, para a pessoa
 * retomar a compra mesmo em outro aparelho (o carrinho normal vive só no
 * navegador onde foi montado).
 *
 * O token tem 48 caracteres aleatórios — não dá para adivinhar. Devolvemos só
 * os itens e o primeiro nome; o e-mail da pessoa não volta na resposta.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('cart-restore', req, res)) return;

  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return res.status(400).json({ error: 'Link inválido' });
  }

  const cart = await getCartByToken(token);
  if (!cart) {
    return res.status(404).json({ error: 'Link expirado ou inválido' });
  }

  return res.status(200).json({
    items: cart.items,
    firstName: (cart.name ?? '').split(' ')[0] || null,
  });
}
