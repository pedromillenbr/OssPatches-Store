import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { CartItem } from '@/types';

/**
 * Carrinhos abandonados — tudo que fala com a tabela mora aqui.
 *
 * SÓ PODE SER USADO NO SERVIDOR: usa a chave de serviço. A tabela não tem
 * policy de RLS nenhuma de propósito (ver supabase/abandoned_carts.sql), então
 * nenhuma dessas operações funciona a partir do navegador.
 *
 * Nada aqui lança erro para cima: perder o registro de um carrinho nunca pode
 * atrapalhar quem está tentando comprar.
 */

export interface AbandonedCartRow {
  id: string;
  email: string;
  name: string | null;
  items: CartItem[];
  subtotal: number;
  currency: string;
  token: string;
  created_at: string;
}

/** Janela do lembrete: nem cedo demais (ainda está comprando), nem tarde demais. */
export const REMINDER_MIN_AGE_HOURS = 1;
export const REMINDER_MAX_AGE_HOURS = 48;

function newToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Registra (ou atualiza) o carrinho aberto de um e-mail.
 *
 * Um carrinho por e-mail: quem volta e tenta de novo atualiza o mesmo
 * registro, em vez de gerar um segundo lembrete. Ao atualizar, zeramos
 * `emailed_at` e `recovered_at` — é um carrinho novo, merece um lembrete novo.
 * O token é preservado para não invalidar um link já enviado.
 */
export async function saveAbandonedCart(input: {
  email: string;
  name?: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  try {
    const email = input.email.trim().toLowerCase();

    const { data: existing } = await admin
      .from('abandoned_carts')
      .select('token, unsubscribed')
      .eq('email', email)
      .maybeSingle();

    const { error } = await admin.from('abandoned_carts').upsert(
      {
        email,
        name: input.name?.trim() || null,
        items: input.items,
        subtotal: input.subtotal,
        currency: input.currency,
        token: existing?.token ?? newToken(),
        emailed_at: null,
        recovered_at: null,
        // Quem pediu para não receber continua sem receber, mesmo voltando.
        unsubscribed: existing?.unsubscribed ?? false,
      },
      { onConflict: 'email' }
    );

    if (error) console.error('[abandonedCart] save:', error.message);
  } catch (err) {
    console.error('[abandonedCart] save (inesperado):', err);
  }
}

/**
 * Fecha o carrinho de quem comprou. Chamado na criação do pedido, nas três
 * formas de pagamento — sem isto, a pessoa compraria e receberia um lembrete
 * dizendo que esqueceu o carrinho.
 */
export async function markCartRecovered(email?: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin || !email) return;

  try {
    const { error } = await admin
      .from('abandoned_carts')
      .update({ recovered_at: new Date().toISOString() })
      .eq('email', email.trim().toLowerCase())
      .is('recovered_at', null);

    if (error) console.error('[abandonedCart] recovered:', error.message);
  } catch (err) {
    console.error('[abandonedCart] recovered (inesperado):', err);
  }
}

/** Carrinhos na janela do lembrete que ainda não receberam e-mail. */
export async function listCartsToRemind(limit = 50): Promise<AbandonedCartRow[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const now = Date.now();
  const newestAllowed = new Date(now - REMINDER_MIN_AGE_HOURS * 3600_000).toISOString();
  const oldestAllowed = new Date(now - REMINDER_MAX_AGE_HOURS * 3600_000).toISOString();

  const { data, error } = await admin
    .from('abandoned_carts')
    .select('id, email, name, items, subtotal, currency, token, created_at')
    .is('emailed_at', null)
    .is('recovered_at', null)
    .eq('unsubscribed', false)
    .lte('created_at', newestAllowed)
    .gte('created_at', oldestAllowed)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[abandonedCart] list:', error.message);
    return [];
  }
  return (data as AbandonedCartRow[]) ?? [];
}

/**
 * Marca o lembrete como enviado.
 *
 * Gravamos ANTES de mandar o e-mail: se o envio falhar, a pessoa fica sem
 * lembrete — o que é bem melhor do que o cron tentar de novo amanhã e ela
 * receber o mesmo e-mail várias vezes.
 */
export async function markCartEmailed(id: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const { error } = await admin
    .from('abandoned_carts')
    .update({ emailed_at: new Date().toISOString() })
    .eq('id', id)
    .is('emailed_at', null);

  if (error) {
    console.error('[abandonedCart] emailed:', error.message);
    return false;
  }
  return true;
}

/** Carrinho pelo token do link do e-mail. */
export async function getCartByToken(token: string): Promise<AbandonedCartRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from('abandoned_carts')
    .select('id, email, name, items, subtotal, currency, token, created_at')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[abandonedCart] byToken:', error.message);
    return null;
  }
  return (data as AbandonedCartRow) ?? null;
}

/** Pedido de "não quero mais receber". */
export async function unsubscribeCart(token: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const { data, error } = await admin
    .from('abandoned_carts')
    .update({ unsubscribed: true })
    .eq('token', token)
    .select('id');

  if (error) {
    console.error('[abandonedCart] unsubscribe:', error.message);
    return false;
  }
  return Boolean(data?.length);
}
