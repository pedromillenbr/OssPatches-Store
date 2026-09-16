import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

/**
 * Protege páginas que exigem login. Se o usuário não estiver autenticado
 * (depois que a sessão terminou de carregar), redireciona para /entrar.
 * Retorna { ready } — true quando é seguro renderizar o conteúdo logado.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/entrar');
    }
  }, [loading, user, router]);

  return { ready: !loading && !!user, loading };
}
