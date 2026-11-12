import type { NextApiRequest, NextApiResponse } from 'next';
import { rejectIfRateLimited } from '@/lib/rateLimit';

/**
 * Recebe erros que aconteceram no navegador do cliente (ver ErrorBoundary) e
 * grava nos logs da Vercel, para sabermos a linha exata que quebrou.
 *
 * Não guarda nada pessoal: só a mensagem do erro, a página e o navegador.
 * Responde 204 sempre — é bastidor e nunca pode atrapalhar o cliente.
 */

const clip = (value: unknown, max: number) => String(value ?? '').slice(0, max);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (await rejectIfRateLimited('client-error', req, res)) return;

  let body: Record<string, unknown> = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    return res.status(204).end();
  }

  // Tira e-mails e números longos (CPF, telefone, cartão) caso apareçam na mensagem.
  const scrub = (s: string) =>
    s.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]').replace(/\d{6,}/g, '[num]');

  console.error(
    '[client-error]',
    JSON.stringify({
      name: clip(body.name, 100),
      message: scrub(clip(body.message, 500)),
      path: clip(body.path, 200),
      ua: clip(body.ua, 300),
      stack: scrub(clip(body.stack, 2000)),
      componentStack: clip(body.extra, 1500),
    })
  );

  return res.status(204).end();
}

export const config = {
  api: { bodyParser: { sizeLimit: '16kb' } },
};
