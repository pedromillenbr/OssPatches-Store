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
import { META_PIXEL_ID } from '@/lib/metaPixel';
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
      {META_PIXEL_ID && (
        <>
          {/*
            Código base do Pixel. `afterInteractive` deixa a página pintar
            primeiro — rastreamento nunca deve atrasar o que o cliente vê.
            O PageView das trocas de rota sai do `pageview()` lá em cima.
          */}
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}</Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
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
