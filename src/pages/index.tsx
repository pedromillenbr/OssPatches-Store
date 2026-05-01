import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import PremiumStats from '@/components/home/PremiumStats';
import ProductGrid from '@/components/home/ProductGrid';
import SocialProof from '@/components/home/SocialProof';
import { CONFIG } from '@/config';

export default function HomePage() {
  return (
    <>
      <NextSeo
        title="Faixas e Patches Premium de Jiu-Jitsu"
        description={CONFIG.siteDescription}
        canonical={CONFIG.siteUrl}
      />
      <Layout>
        <Hero />
        <PremiumStats />
        <ProductGrid />
        <SocialProof />
      </Layout>
    </>
  );
}
