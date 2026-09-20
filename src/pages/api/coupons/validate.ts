import type { NextApiRequest, NextApiResponse } from 'next';
import { checkCoupon } from '@/lib/couponUsage';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

export type CouponValidateResponse =
  | { valid: true; code: string; discountPercent: number; remaining?: number | null }
  | { valid: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CouponValidateResponse>
) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('coupons', req, res)) return;

  if (isBodyTooLarge(req, 1024)) {
    return res.status(413).json({ valid: false, error: 'Requisição muito grande' });
  }

  const { code, email } = req.body as { code?: string; email?: string };

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Cupom inválido' });
  }

  /*
   * O e-mail é opcional: no carrinho o cliente ainda não preencheu os dados,
   * então só dá para conferir se o cupom existe e está ligado. No checkout,
   * com o e-mail em mãos, também conferimos quantas compras ele já fez com
   * este cupom — assim a recusa aparece antes da tela de pagamento.
   */
  const check = await checkCoupon(code, typeof email === 'string' ? email : undefined);

  if (check.error || !check.code) {
    return res
      .status(200)
      .json({ valid: false, error: check.error || 'Cupom inválido ou expirado' });
  }

  return res.status(200).json({
    valid: true,
    code: check.code,
    discountPercent: check.percent,
    remaining: check.remaining ?? null,
  });
}
