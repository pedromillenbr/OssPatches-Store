import { useState } from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AuthShell from '@/components/account/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function SenhaPerdidaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    // Não revelamos se o e-mail existe (boa prática de segurança/privacidade).
    if (error) {
      toast.error('Não foi possível enviar agora. Tente novamente.');
      return;
    }
    setSent(true);
  };

  return (
    <Layout>
      <NextSeo title="Senha perdida" noindex />
      <AuthShell
        title="Senha perdida"
        subtitle="Enviamos um link para você criar uma nova senha."
        footer={
          <p>
            Lembrou?{' '}
            <Link href="/entrar" className="font-semibold text-brand-black underline underline-offset-4">
              Voltar para entrar
            </Link>
          </p>
        }
      >
        {sent ? (
          <div className="rounded-lg border border-brand-gray-200 bg-brand-gray-50 p-6">
            <p className="font-semibold text-brand-black">Verifique seu e-mail</p>
            <p className="mt-2 text-sm text-brand-gray-600">
              Se houver uma conta para <strong>{email}</strong>, você receberá um link
              para redefinir a senha em instantes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Enviar link
            </Button>
          </form>
        )}
      </AuthShell>
    </Layout>
  );
}
