import type { NextApiRequest, NextApiResponse } from 'next';
import { VALID_COUPONS } from '@/config/coupons';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { isBodyTooLarge } from '@/lib/sanitize';
import { handleCors } from '@/lib/cors';

export type CouponValidateResponse =
  | { valid: true; code: string; discountPercent: number }
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

  const { code } = req.body as { code?: string };

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Cupom inválido' });
  }

  const upperCode = code.trim().toUpperCase();
  const discountPercent = VALID_COUPONS[upperCode];

  if (!discountPercent) {
    return res.status(200).json({ valid: false, error: 'Cupom inválido ou expirado' });
  }

  return res.status(200).json({ valid: true, code: upperCode, discountPercent });
}
