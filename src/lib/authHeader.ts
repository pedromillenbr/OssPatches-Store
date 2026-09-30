import { supabase } from '@/lib/supabase';

/**
 * Cabeçalho que diz ao servidor quem é o cliente logado.
 *
 * Usado no checkout para o pedido já nascer amarrado à conta. Cliente sem
 * cadastro devolve {} — e a compra segue normal: o pedido é gravado pelo
 * e-mail e aparece na conta se a pessoa se cadastrar depois.
 */
export async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
