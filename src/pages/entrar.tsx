import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AuthShell from '@/components/account/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function EntrarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Já logado? Manda para a conta.
  useEffect(() => {
    if (!authLoading && user) router.replace('/minha-conta');
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar. Tente novamente.'
      );
      return;
    }
    toast.success('Bem-vindo de volta!');
    router.push('/minha-conta');
  };

  return (
    <Layout>
      <NextSeo title="Entrar" noindex />
      <AuthShell
        title="Entrar"
        subtitle="Acesse sua conta para ver pedidos e interesses."
        footer={
          <p>
            Ainda não tem conta?{' '}
            <Link href="/criar-conta" className="font-semibold text-brand-black underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Link
              href="/senha-perdida"
              className="mt-2 inline-block text-xs text-brand-gray-500 hover:text-brand-black"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Entrar
          </Button>
        </form>
      </AuthShell>
    </Layout>
  );
}
