import type { NextApiRequest } from 'next';
import { createClient } from '@supabase/supabase-js';

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Descobre, no servidor, quem é o cliente logado que fez a chamada.
 *
 * O navegador manda o token da sessão no cabeçalho Authorization. Conferimos
 * o token com a chave PÚBLICA (nunca a de serviço): é o Banco de Dados que
 * diz quem é o usuário, então ninguém se passa por outro mandando um e-mail
 * qualquer no corpo da requisição.
 *
 * Devolve null para visitante sem conta — o que é normal: a loja aceita
 * compra sem cadastro.
 */
export async function getSessionUser(req: NextApiRequest): Promise<SessionUser | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return null;

    return { id: data.user.id, email: data.user.email.toLowerCase() };
  } catch (err) {
    console.error('[sessionUser] falha ao identificar o cliente:', err);
    return null;
  }
}
