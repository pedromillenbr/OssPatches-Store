import type { NextApiRequest, NextApiResponse } from 'next';
import { COUPONS } from '@/config/coupons';
import { isCouponActive, setCouponActive } from '@/lib/couponUsage';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { handleCors } from '@/lib/cors';

/**
 * Liga/desliga dos cupons, usado pelo painel em /admin/cupons.
 * GET  → lista os cupons e se cada um está ligado.
 * POST → { code, active } liga ou desliga um cupom.
 *
 * Só o dono da loja acessa: a permissão é conferida no servidor, não basta
 * abrir a página do admin.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  if (req.method === 'GET') {
    const list = await Promise.all(
      Object.entries(COUPONS).map(async ([code, rule]) => ({
        code,
        percent: rule.percent,
        maxUsesPerCustomer: rule.maxUsesPerCustomer,
        active: await isCouponActive(code, rule),
      }))
    );
    return res.status(200).json({ coupons: list });
  }

  if (req.method === 'POST') {
    const { code, active } = req.body as { code?: string; active?: boolean };

    if (typeof code !== 'string' || !COUPONS[code.toUpperCase()]) {
      return res.status(400).json({ error: 'Cupom desconhecido' });
    }
    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const saved = await setCouponActive(code.toUpperCase(), active);
    if (!saved) {
      return res
        .status(503)
        .json({ error: 'Não foi possível salvar agora. Tente de novo em instantes.' });
    }

    return res.status(200).json({ code: code.toUpperCase(), active });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
