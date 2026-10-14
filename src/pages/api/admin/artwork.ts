import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/requireAdminApi';
import { handleCors } from '@/lib/cors';
import { ARTWORK_BUCKET, isArtworkPath } from '@/lib/artwork';

/**
 * Link temporário (10 min) para o admin baixar a arte de um pedido. O
 * arquivo vem como download, com o nome original que o cliente enviou.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isAdminRequest(req))) {
    return res.status(403).json({ error: 'Acesso restrito' });
  }

  const { path } = req.query;
  if (!isArtworkPath(path)) {
    return res.status(400).json({ error: 'Arte inválida' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Banco de Dados não configurado no servidor.' });
  }

  // Nome do arquivo no download: o original do cliente, só com caracteres
  // seguros e a extensão real do arquivo guardado.
  const ext = path.slice(path.lastIndexOf('.'));
  const rawName = typeof req.query.name === 'string' ? req.query.name : '';
  const base = rawName.replace(/\.[^.]*$/, '').replace(/[^\w.\- ]+/g, '').trim().slice(0, 80);
  const downloadName = `${base || 'arte'}${ext}`;

  const { data, error } = await admin.storage
    .from(ARTWORK_BUCKET)
    .createSignedUrl(path, 600, { download: downloadName });
  if (error || !data) {
    console.error('[artwork] signed url:', error?.message);
    return res.status(404).json({ error: 'Arte não encontrada.' });
  }

  return res.status(200).json({ url: data.signedUrl });
}
