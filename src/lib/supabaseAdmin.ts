import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente do Banco de Dados com privilégio de serviço — SÓ PODE SER USADO NO
 * SERVIDOR (rotas /api). A chave ignora o RLS, então nunca a importe em
 * componente de página: ela vazaria para o navegador.
 *
 * Usamos a URL real do Supabase (não o proxy /sb-api): o proxy existe apenas
 * para o navegador contornar bloqueadores, e aqui já estamos no servidor.
 *
 * Devolve null quando a variável SUPABASE_SERVICE_ROLE_KEY não está
 * configurada, para que a ausência dela nunca derrube o checkout nem o
 * webhook — o recurso simplesmente fica inativo e avisa no log.
 */
let cached: SupabaseClient | null = null;
let warned = false;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    if (!warned) {
      warned = true;
      console.warn(
        '[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY ausente — a sincronização ' +
          'de status do pedido com a conta do cliente está desligada.'
      );
    }
    return null;
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
