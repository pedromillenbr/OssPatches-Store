import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import ProgressBar from '@/components/checkout/ProgressBar';
import IdentificationStep from '@/components/checkout/IdentificationStep';
import AddressStep from '@/components/checkout/AddressStep';
import ShippingStep from '@/components/checkout/ShippingStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import SuccessStep from '@/components/checkout/SuccessStep';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

const STEP_TITLES: Record<string, string> = {
  identification: 'Seus dados',
  address: 'Endereço de entrega',
  shipping: 'Escolha o frete',
  payment: 'Pagamento',
  success: 'Pedido confirmado',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { step } = useCheckoutStore();
  const { items } = useCartStore();

  // Redirect to cart if empty (client-side only)
  useEffect(() => {
    if (items.length === 0 && step !== 'success') {
      router.replace('/carrinho');
    }
  }, [items.length, step, router]);

  return (
    <>
      <NextSeo title="Checkout" noindex />
      <Layout showFooter={false}>
        <div className="container-site py-8 sm:py-12 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="font-bold text-xl text-brand-black">
              OssPatches
            </Link>
            {step !== 'success' && (
              <Link
                href="/carrinho"
                className="text-sm text-brand-gray-500 hover:text-brand-black transition-colors"
              >
                ← Carrinho
              </Link>
            )}
          </div>

          {/* Progress bar */}
          {step !== 'success' && (
            <div className="mb-10">
              <ProgressBar currentStep={step} />
            </div>
          )}

          {/* Step content */}
          <div>
            {step !== 'success' && (
              <h2 className="text-2xl font-bold text-brand-black mb-6">
                {STEP_TITLES[step]}
              </h2>
            )}

            {step === 'identification' && <IdentificationStep />}
            {step === 'address' && <AddressStep />}
            {step === 'shipping' && <ShippingStep />}
            {step === 'payment' && <PaymentStep />}
            {step === 'success' && <SuccessStep />}
          </div>
        </div>
      </Layout>
    </>
  );
}
