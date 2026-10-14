import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { rejectIfRateLimited } from '@/lib/rateLimit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleCors } from '@/lib/cors';
import { ARTWORK_BUCKET, ARTWORK_MAX_BYTES } from '@/lib/artwork';

const EXT_BY_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
};

/**
 * Entrega um link de envio de uso único para a arte do patch.
 *
 * O cliente pode estar comprando sem conta, então o envio não passa pelo
 * login: o servidor escolhe o nome do arquivo e assina o link. O bucket é
 * privado e só aceita PDF/PNG de até 20 MB (regra do próprio Banco de Dados).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (await rejectIfRateLimited('artwork-upload', req, res)) return;

  const { contentType, size } = (req.body ?? {}) as { contentType?: unknown; size?: unknown };
  const ext = typeof contentType === 'string' ? EXT_BY_TYPE[contentType] : undefined;
  if (!ext) {
    return res.status(400).json({ error: 'Envie a arte em PDF ou PNG.' });
  }
  if (typeof size !== 'number' || size <= 0 || size > ARTWORK_MAX_BYTES) {
    return res.status(400).json({ error: 'A arte precisa ter até 20 MB.' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Envio de arte indisponível no momento.' });
  }

  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(ARTWORK_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[artwork] upload-url:', error?.message);
    return res.status(500).json({ error: 'Não foi possível enviar a arte. Tente novamente.' });
  }

  return res.status(200).json({ path, token: data.token });
}
