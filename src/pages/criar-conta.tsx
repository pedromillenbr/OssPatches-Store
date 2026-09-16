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

export default function CriarContaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/minha-conta');
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/entrar`,
      },
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      toast.error(
        msg.includes('already registered') || msg.includes('already been registered')
          ? 'Este e-mail já tem uma conta. Tente entrar.'
          : msg.includes('invalid') && msg.includes('email')
          ? 'E-mail inválido. Confira e tente de novo.'
          : msg.includes('password')
          ? 'Senha muito curta ou fraca (mínimo 6 caracteres).'
          : `Não foi possível criar a conta: ${error.message}`
      );
      return;
    }

    // Se a confirmação por e-mail estiver ligada, não há sessão ainda.
    if (data.session) {
      toast.success('Conta criada!');
      router.push('/minha-conta');
    } else {
      setDone(true);
    }
  };

  return (
    <Layout>
      <NextSeo title="Criar conta" noindex />
      <AuthShell
        title="Criar conta"
        subtitle="Leva menos de um minuto."
        footer={
          <p>
            Já tem conta?{' '}
            <Link href="/entrar" className="font-semibold text-brand-black underline underline-offset-4">
              Entrar
            </Link>
          </p>
        }
      >
        {done ? (
          <div className="rounded-lg border border-brand-gray-200 bg-brand-gray-50 p-6">
            <p className="font-semibold text-brand-black">Confirme seu e-mail</p>
            <p className="mt-2 text-sm text-brand-gray-600">
              Enviamos um link de confirmação para <strong>{email}</strong>. Abra o
              e-mail para ativar sua conta e depois faça login.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nome completo"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Mínimo de 6 caracteres."
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Criar conta
            </Button>
            <p className="text-xs text-brand-gray-500">
              Ao criar uma conta, você concorda com nossa{' '}
              <Link href="/politica-de-privacidade" className="underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </form>
        )}
      </AuthShell>
    </Layout>
  );
}
