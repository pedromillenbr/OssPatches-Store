import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import SuccessStep from '@/components/checkout/SuccessStep';

export default function SuccessPage() {
  return (
    <>
      <NextSeo title="Pedido confirmado" noindex />
      <Layout showFooter={false}>
        <div className="container-site py-12 max-w-lg mx-auto">
          <SuccessStep />
        </div>
      </Layout>
    </>
  );
}
