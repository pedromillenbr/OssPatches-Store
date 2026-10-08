import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
 *
 * Quem teve a conta criada pela compra chega com um código depois do "#"
 * (ver src/lib/autoAccount.ts): trocamos esse código pela sessão aqui.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // 'new' = conta recém-criada pela compra; 'expired' = código já usado/vencido.
  const [welcome, setWelcome] = useState<'new' | 'expired' | null>(null);

  useEffect(() => {
    const tokenHash = new URLSearchParams(window.location.hash.slice(1)).get('token_hash');
    if (!tokenHash) return;

    // Tira o código da barra de endereço: ele só vale uma vez.
    window.history.replaceState(null, '', window.location.pathname);
    setWelcome('new');
    supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
      if (error) setWelcome('expired');
    });
  }, []);

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
      <AuthShell
        title={welcome ? 'Crie sua senha' : 'Nova senha'}
        subtitle={
          welcome
            ? 'Sua conta já existe. Escolha a senha para entrar.'
            : 'Escolha uma nova senha para sua conta.'
        }
      >
        {welcome === 'expired' && (
          <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este link já foi usado ou expirou.{' '}
            <Link href="/senha-perdida" className="font-semibold underline">
              Peça um novo aqui
            </Link>
            .
          </p>
        )}
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
