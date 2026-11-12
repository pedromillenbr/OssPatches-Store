import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { FUNNEL_STEPS, type FunnelStep } from '@/lib/funnel';

/**
 * Recebe "o visitante X chegou à etapa Y" e grava em checkout_events.
 * Responde 204 sempre que o formato está ok, mesmo se a gravação falhar —
 * é bastidor e não pode atrapalhar ninguém.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (await rejectIfRateLimited('funnel', req, res)) return;

  let body: Record<string, unknown> = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    return res.status(400).end();
  }

  const visitorId = String(body.visitorId ?? '');
  const step = String(body.step ?? '') as FunnelStep;
  if (!/^[a-z0-9]{20,40}$/.test(visitorId) || !FUNNEL_STEPS.includes(step)) {
    return res.status(400).end();
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    const { error } = await admin
      .from('checkout_events')
      .upsert({ visitor_id: visitorId, step }, { onConflict: 'visitor_id,step,day', ignoreDuplicates: true });
    if (error) console.error('[funnel] save:', error.message);
  }

  return res.status(204).end();
}

export const config = {
  api: { bodyParser: { sizeLimit: '1kb' } },
};
