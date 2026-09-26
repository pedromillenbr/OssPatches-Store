import type { NextApiRequest, NextApiResponse } from 'next';
import { saveAbandonedCart } from '@/lib/abandonedCart';
import { getProductBySlug } from '@/services/products';
import { isValidEmail, normalizeEmail } from '@/lib/email';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';
import type { CartItem } from '@/types';

/**
 * Guarda o carrinho de quem informou o e-mail no checkout, para o lembrete de
 * carrinho abandonado.
 *
 * O e-mail vem do navegador, então em tese alguém poderia usar esta rota para
 * disparar lembretes a endereços de terceiros. O que segura isso: rate limit
 * curto por IP, um único lembrete por endereço (`emailed_at` só é gravado uma
 * vez) e a espera de 1h antes do envio. Além disso, só aceitamos itens que
 * existem no catálogo — payload inventado não vira e-mail.
 *
 * Responde 204 sempre que o formato está ok, mesmo se a gravação falhar:
 * é um recurso de bastidor e não pode travar o checkout de ninguém.
 */

const MAX_ITEMS = 20;

/** Mantém só o que o e-mail e a restauração precisam, com tipos garantidos. */
function normalizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .slice(0, MAX_ITEMS)
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const item = entry as Record<string, unknown>;

      // Só entra o que existe no catálogo: bloqueia carrinho forjado.
      const slug = String(item.slug ?? '');
      const product = getProductBySlug(slug);
      if (!product) return null;

      const quantity = Math.min(Math.max(Math.floor(Number(item.quantity) || 1), 1), 99);
      const price = Number(item.price);

      return {
        cartId: String(item.cartId ?? ''),
        productId: String(item.productId ?? ''),
        slug,
        name: String(item.name ?? product.name).slice(0, 200),
        category: item.category,
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        quantity,
        customization: item.customization ?? {},
        image: String(item.image ?? '').slice(0, 500),
      } as CartItem;
    })
    .filter((item): item is CartItem => item !== null);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('cart-save', req, res)) return;

  if (isBodyTooLarge(req, 100 * 1024)) {
    return res.status(413).json({ error: 'Requisição muito grande' });
  }

  const email = normalizeEmail(String(req.body?.email ?? ''));
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  const items = normalizeItems(req.body?.items);
  if (items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = req.body?.currency === 'USD' ? 'USD' : 'BRL';
  const name = typeof req.body?.name === 'string' ? req.body.name.slice(0, 120) : undefined;

  await saveAbandonedCart({ email, name, items, subtotal, currency });

  return res.status(204).end();
}
