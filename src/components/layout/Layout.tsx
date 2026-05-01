import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export default function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
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
