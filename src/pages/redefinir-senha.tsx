import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AuthShell from '@/components/account/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

/**
 * O usuário chega aqui pelo link do e-mail. O Supabase já cria uma sessão
 * temporária de recuperação, então basta atualizar a senha.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error('O link expirou ou é inválido. Peça um novo.');
      return;
    }
    toast.success('Senha atualizada!');
    router.push('/minha-conta');
  };

  return (
    <Layout>
      <NextSeo title="Redefinir senha" noindex />
      <AuthShell title="Nova senha" subtitle="Escolha uma nova senha para sua conta.">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Mínimo de 6 caracteres."
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Salvar nova senha
          </Button>
        </form>
      </AuthShell>
    </Layout>
  );
}
