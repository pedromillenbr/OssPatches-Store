import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import AccountLayout from '@/components/account/AccountLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';

export default function PerfilPage() {
  const { ready } = useRequireAuth();
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Não foi possível salvar. Tente novamente.');
      return;
    }
    await refreshProfile();
    toast.success('Perfil atualizado');
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Escolha um arquivo de imagem.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('A imagem precisa ter no máximo 3 MB.');
      return;
    }

    setUploading(true);
    // Guardamos em uma pasta com o id do usuário (o RLS do storage exige isso).
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (upErr) {
      setUploading(false);
      toast.error('Falha no upload da foto.');
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    // ?t= evita cache antigo da imagem trocada
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    setUploading(false);
    if (dbErr) {
      toast.error('Foto enviada, mas não foi possível salvar.');
      return;
    }
    await refreshProfile();
    toast.success('Foto atualizada');
  };

  if (!ready) {
    return (
      <Layout>
        <div className="container-site flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gray-300 border-t-brand-black" />
        </div>
      </Layout>
    );
  }

  const initial = (fullName || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <Layout>
      <NextSeo title="Meu perfil" noindex />
      <AccountLayout title="Meu perfil">
        {/* Foto */}
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-black">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Sua foto"
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-white">
                {initial}
              </span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {profile?.avatar_url ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            <p className="mt-2 text-xs text-brand-gray-500">JPG ou PNG, até 3 MB.</p>
          </div>
        </div>

        {/* Dados */}
        <form onSubmit={handleSave} className="mt-8 max-w-md space-y-5">
          <Input
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="E-mail"
            value={user?.email ?? ''}
            disabled
            hint="Para alterar o e-mail, fale com o suporte."
          />
          <Input
            label="Telefone / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="(11) 99999-9999"
          />
          <Button type="submit" size="lg" loading={saving}>
            Salvar alterações
          </Button>
        </form>
      </AccountLayout>
    </Layout>
  );
}
