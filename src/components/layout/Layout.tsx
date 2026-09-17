import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Header from './Header';
import Footer from './Footer';

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/ui/WhatsAppButton'), { ssr: false });
const Toaster = dynamic(() => import('react-hot-toast').then(m => ({ default: m.Toaster })), { ssr: false });

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export default function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/*
        --header-h é medida pelo Header em tempo real. O valor fixo antigo
        (124px) sobrava no celular e deixava uma faixa branca no topo.
      */}
      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 110px)' }}>
        {children}
      </main>
      {showFooter && <Footer />}
      <CartDrawer />
      <WhatsAppButton />
      {/*
        No celular o toast ficava embaixo do botão do WhatsApp. Subindo para o
        topo ele aparece logo abaixo do header e nunca é encoberto.
      */}
      <Toaster
        position="top-center"
        containerStyle={{ top: 'calc(var(--header-h, 110px) + 12px)' }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0A0A0A',
            color: '#FAFAFA',
            fontSize: '14px',
            borderRadius: '0px',
            padding: '12px 16px',
            maxWidth: '90vw',
          },
        }}
      />
    </div>
  );
}
