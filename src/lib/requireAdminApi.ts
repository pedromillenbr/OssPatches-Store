import type { NextApiRequest } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Confere, no servidor, se quem chamou a rota é o dono da loja.
 *
 * O painel manda o token da sessão do Supabase no cabeçalho Authorization.
 * Criamos um cliente com ESSE token (chave pública, nunca a de serviço) e
 * perguntamos ao banco quem é o usuário. Em seguida lemos `profiles.is_admin`
 * — protegido por RLS, então ninguém consegue ler o perfil de outra pessoa
 * nem se promover a admin.
 */
export async function isAdminRequest(req: NextApiRequest): Promise<boolean> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .single();

    return profile?.is_admin === true;
  } catch (err) {
    console.error('[admin] falha ao verificar permissão:', err);
    return false;
  }
}
