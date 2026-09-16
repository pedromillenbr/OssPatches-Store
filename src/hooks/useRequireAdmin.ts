import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

/**
 * Protege páginas de administração. Só o dono (is_admin) acessa.
 * Não-logado → /entrar. Logado mas sem permissão → home.
 * A segurança real é garantida pelo RLS no banco; isto é só a UX.
 */
export function useRequireAdmin() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/entrar');
    } else if (profile && !profile.is_admin) {
      router.replace('/');
    }
  }, [loading, user, profile, router]);

  return { ready: !loading && !!user && !!profile?.is_admin, loading };
}
