import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { DefaultSeo, OrganizationJsonLd } from 'next-seo';
import '@/styles/globals.css';
import { CONFIG } from '@/config';
import { GA_ID, pageview } from '@/lib/analytics';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => pageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <AuthProvider>
    <main className={inter.className}>
      <Head>
        {/*
          Sem esta linha o celular renderiza a página como se fosse um desktop
          encolhido. viewport-fit=cover libera a área do notch/ilha dinâmica.
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}</Script>
        </>
      )}
      <DefaultSeo
        titleTemplate="%s | OssPatches"
        defaultTitle="OssPatches — Faixas e Patches Premium de Jiu-Jitsu"
        description={CONFIG.siteDescription}
        openGraph={{
          type: 'website',
          locale: 'pt_BR',
          url: CONFIG.siteUrl,
          siteName: CONFIG.siteName,
          images: [
            {
              url: `${CONFIG.siteUrl}/images/brand/aguia-simbolo.png`,
              width: 2000,
              height: 2000,
              alt: 'OssPatches — Faixas e Patches Premium de Jiu-Jitsu',
            },
          ],
        }}
        twitter={{
          cardType: 'summary_large_image',
        }}
        additionalLinkTags={[
          { rel: 'icon', href: '/images/brand/aguia-simbolo.svg', type: 'image/svg+xml' },
        ]}
      />
      {/* Structured Data da marca — ajuda o Google a exibir nome, logo e redes */}
      <OrganizationJsonLd
        type="Organization"
        id={CONFIG.siteUrl}
        name="OssPatches"
        url={CONFIG.siteUrl}
        logo={`${CONFIG.siteUrl}/images/brand/aguia-simbolo.png`}
        sameAs={[CONFIG.social.instagram]}
      />
      <Component {...pageProps} />
    </main>
    </AuthProvider>
  );
}
