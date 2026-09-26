import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import {
  listCartsToRemind,
  markCartEmailed,
  REMINDER_MIN_AGE_HOURS,
  REMINDER_MAX_AGE_HOURS,
} from '@/lib/abandonedCart';
import { sendAbandonedCartEmail } from '@/services/email';

/**
 * Varredura dos carrinhos abandonados — roda pelo Vercel Cron (ver vercel.json).
 *
 * Manda no máximo um lembrete por carrinho, para quem abandonou entre
 * REMINDER_MIN_AGE_HOURS e REMINDER_MAX_AGE_HOURS atrás. Fora dessa janela não
 * mandamos nada: cedo demais é atropelar quem ainda está comprando, tarde
 * demais é e-mail sobre um carrinho que a pessoa já esqueceu.
 *
 * A rota é pública na internet, então exige o CRON_SECRET. Sem ele configurado
 * a rota se recusa a rodar em produção — melhor não mandar e-mail nenhum do
 * que deixar qualquer pessoa disparar a fila inteira.
 */

/** Comparação em tempo constante, para o segredo não vazar pelo tempo de resposta. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('[cron] CRON_SECRET ausente — varredura recusada');
    return res.status(500).json({ error: 'Cron not configured' });
  }

  const header = req.headers.authorization ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!provided || !secretMatches(provided, secret)) {
    console.warn('[cron] chamada sem autorização válida');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const carts = await listCartsToRemind();
  let sent = 0;
  let failed = 0;

  for (const cart of carts) {
    // Marcamos ANTES de enviar. Se o envio falhar, a pessoa fica sem lembrete
    // — bem melhor do que a varredura de amanhã mandar o mesmo e-mail de novo.
    // O update é condicional (só se emailed_at ainda é nulo), então duas
    // execuções simultâneas nunca mandam o mesmo lembrete duas vezes.
    const claimed = await markCartEmailed(cart.id);
    if (!claimed) continue;

    try {
      await sendAbandonedCartEmail({
        email: cart.email,
        firstName: (cart.name ?? '').split(' ')[0] || null,
        items: cart.items,
        subtotal: Number(cart.subtotal),
        currency: cart.currency,
        token: cart.token,
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[cron] falha ao enviar lembrete de ${cart.id}:`, err);
    }
  }

  console.log(
    `[cron] carrinhos abandonados: ${carts.length} na janela ` +
      `(${REMINDER_MIN_AGE_HOURS}h–${REMINDER_MAX_AGE_HOURS}h), ${sent} enviados, ${failed} falharam`
  );

  return res.status(200).json({ found: carts.length, sent, failed });
}
