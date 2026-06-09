import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { DefaultSeo } from 'next-seo';
import '@/styles/globals.css';
import { CONFIG } from '@/config';
import { GA_ID, pageview } from '@/lib/analytics';

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
    <main className={inter.className}>
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
              url: `${CONFIG.siteUrl}/og-image.jpg`,
              width: 1200,
              height: 630,
              alt: 'OssPatches — Faixas e Patches Premium de Jiu-Jitsu',
            },
          ],
        }}
        twitter={{
          cardType: 'summary_large_image',
        }}
        additionalLinkTags={[
          { rel: 'icon', href: '/favicon.ico' },
        ]}
      />
      <Component {...pageProps} />
    </main>
  );
}
