import { GetStaticPaths, GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import { Product, PatchProduct } from '@/types';
import { getProductBySlug, getAllSlugs } from '@/services/products';
import Layout from '@/components/layout/Layout';
import ProductGallery from '@/components/product/ProductGallery';
import BeltCustomizer from '@/components/product/BeltCustomizer';
import PatchCustomizer from '@/components/product/PatchCustomizer';
import UrgencyBadge from '@/components/product/UrgencyBadge';
import BeltSizeGuide from '@/components/product/BeltSizeGuide';
import { CONFIG } from '@/config';
import Link from 'next/link';

interface ProductPageProps {
  product: Product | PatchProduct;
}

function isBelt(p: Product | PatchProduct): p is Product {
  return p.category === 'belt-adult' || p.category === 'belt-kids';
}

export default function ProductPage({ product }: ProductPageProps) {
  const belt = isBelt(product) ? product : null;
  const patch = !isBelt(product) ? (product as PatchProduct) : null;

  return (
    <>
      <NextSeo
        title={product.metaTitle}
        description={product.metaDescription}
        canonical={`${CONFIG.siteUrl}/produtos/${product.slug}`}
        openGraph={{
          url: `${CONFIG.siteUrl}/produtos/${product.slug}`,
          title: product.metaTitle,
          description: product.metaDescription,
        }}
      />

      <Layout>
        <div className="container-site py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-brand-gray-400 mb-8">
            <Link href="/" className="hover:text-brand-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-brand-black">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Gallery */}
            <div>
              <ProductGallery
                images={product.images}
                productName={product.name}
                colorHex={belt?.colorHex || '#171717'}
                colorHexSecondary={belt?.colorHexSecondary}
                color={belt?.color || 'black'}
              />
            </div>

            {/* Info + Customizer */}
            <div className="space-y-6">
              {/* Category label */}
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-gray-400">
                {product.category === 'belt-adult'
                  ? 'Faixa Adulto'
                  : product.category === 'belt-kids'
                  ? 'Faixa Infantil'
                  : 'Patch BJJ'}
              </p>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl font-black text-brand-black leading-tight">
                {product.name}
              </h1>

              {/* Description */}
              <p className="text-brand-gray-600 leading-relaxed">
                {product.description}
              </p>

              <UrgencyBadge />

              {/* Features */}
              <ul className="space-y-2">
                {product.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-brand-gray-700"
                  >
                    <span className="text-brand-black mt-0.5 shrink-0">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <hr className="border-brand-gray-200" />

              {/* Customizer */}
              {belt && <BeltCustomizer product={belt} />}
              {patch && <PatchCustomizer product={patch} />}
            </div>
          </div>

          {/* Size Guide - Only for belts */}
          {belt && (
            <div className="mt-12 sm:mt-16">
              <BeltSizeGuide isKids={belt.category === 'belt-kids'} />
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const product = getProductBySlug(slug);

  if (!product) {
    return { notFound: true };
  }

  return {
    props: { product },
  };
};
