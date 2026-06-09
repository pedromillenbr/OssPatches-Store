import { GetStaticPaths, GetStaticProps } from 'next';
import { useState, useEffect } from 'react';
import { NextSeo, ProductJsonLd } from 'next-seo';
import { Product, PatchProduct } from '@/types';
import { getProductBySlug, getAllSlugs, getAllProducts, formatPrice } from '@/services/products';
import Layout from '@/components/layout/Layout';
import ProductGallery from '@/components/product/ProductGallery';
import BeltCustomizer from '@/components/product/BeltCustomizer';
import PatchCustomizer from '@/components/product/PatchCustomizer';
import UrgencyBadge from '@/components/product/UrgencyBadge';
import BeltSizeGuide from '@/components/product/BeltSizeGuide';
import ProductFAQ from '@/components/product/ProductFAQ';
import RelatedProducts from '@/components/product/RelatedProducts';
import { CONFIG } from '@/config';
import { trackViewProduct } from '@/lib/analytics';
import Link from 'next/link';

interface ProductPageProps {
  product: Product | PatchProduct;
  allProducts: (Product | PatchProduct)[];
}

function isBelt(p: Product | PatchProduct): p is Product {
  return p.category === 'belt-adult' || p.category === 'belt-kids';
}

export default function ProductPage({ product, allProducts }: ProductPageProps) {
  const belt = isBelt(product) ? product : null;
  const patch = !isBelt(product) ? (product as PatchProduct) : null;
  const [patchImageIndex, setPatchImageIndex] = useState(0);

  useEffect(() => {
    trackViewProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.basePrice,
    });
  }, [product.id, product.name, product.category, product.basePrice]);

  const canonicalUrl = `${CONFIG.siteUrl}/produtos/${product.slug}`;
  const productImage = product.images[0]
    ? product.images[0].startsWith('http')
      ? product.images[0]
      : `${CONFIG.siteUrl}${product.images[0]}`
    : `${CONFIG.siteUrl}/og-image.jpg`;

  const categoryLabel = belt
    ? belt.category === 'belt-adult'
      ? 'Faixas Adulto'
      : 'Faixas Infantil'
    : 'Patches BJJ';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: CONFIG.siteUrl },
      { '@type': 'ListItem', position: 2, name: categoryLabel, item: `${CONFIG.siteUrl}/` },
      { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <NextSeo
        title={product.metaTitle}
        description={product.metaDescription}
        canonical={canonicalUrl}
        openGraph={{
          type: 'website',
          url: canonicalUrl,
          title: product.metaTitle,
          description: product.metaDescription,
          images: [
            {
              url: productImage,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ],
        }}
        additionalMetaTags={[
          { name: 'keywords', content: product.metaKeywords ?? '' },
        ]}
      />

      <ProductJsonLd
        productName={product.name}
        description={product.metaDescription}
        images={[productImage]}
        brand="OssPatches"
        offers={[
          {
            price: String(product.basePrice),
            priceCurrency: 'BRL',
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: canonicalUrl,
            seller: { name: 'OssPatches' },
          },
        ]}
        aggregateRating={
          product.aggregateRating
            ? {
                ratingValue: String(product.aggregateRating.ratingValue),
                reviewCount: String(product.aggregateRating.reviewCount),
              }
            : undefined
        }
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
                selectedIndex={patch ? patchImageIndex : undefined}
                onSelectIndex={patch ? setPatchImageIndex : undefined}
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
              {patch && <PatchCustomizer product={patch} onFormatChange={setPatchImageIndex} />}
            </div>
          </div>

          {/* Size Guide — only for belts */}
          {belt && (
            <div className="mt-12 sm:mt-16">
              <BeltSizeGuide isKids={belt.category === 'belt-kids'} />
            </div>
          )}

          {/* FAQ */}
          <div className="mt-4">
            <ProductFAQ isPatch={!!patch} />
          </div>

          {/* Related products */}
          <RelatedProducts current={product} products={allProducts} />
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
    props: {
      product,
      allProducts: getAllProducts(),
    },
  };
};
