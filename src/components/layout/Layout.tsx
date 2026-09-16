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
      <main className="flex-1 pt-[124px] md:pt-[132px]">{children}</main>
      {showFooter && <Footer />}
      <CartDrawer />
      <WhatsAppButton />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0A0A0A',
            color: '#FAFAFA',
            fontSize: '14px',
            borderRadius: '0px',
            padding: '12px 16px',
          },
        }}
      />
    </div>
  );
}
