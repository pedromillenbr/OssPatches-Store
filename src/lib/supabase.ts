import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para o navegador.
 *
 * No navegador, falamos com o Supabase através do NOSSO próprio domínio
 * (/sb-api), que o Next.js redireciona internamente para o Supabase
 * (ver rewrites em next.config.js). Assim a requisição é "mesma origem" e
 * o Brave/bloqueadores não a barram como se fosse um domínio de terceiro.
 *
 * No servidor (SSR), usamos a URL real do Supabase diretamente.
 * A segurança real vem do RLS no banco: cada usuário só acessa o que é dele.
 */
const realUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const browserUrl =
  typeof window !== 'undefined' ? `${window.location.origin}/sb-api` : realUrl;

export const supabase = createBrowserClient(browserUrl, anonKey, {
  auth: {
    // Chave de armazenamento fixa da sessão (a URL via proxy não tem o
    // subdomínio do projeto para derivar automaticamente).
    storageKey: 'osspatches-auth',
  },
});
