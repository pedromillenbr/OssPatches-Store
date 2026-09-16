import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para o navegador (browser).
 * Usa a chave pública (publishable) — segura para expor no frontend.
 * A segurança real vem do RLS (Row Level Security) no banco: cada usuário
 * só consegue ler/escrever os próprios dados.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
