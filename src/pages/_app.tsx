import type { AppProps } from 'next/app';
import { DefaultSeo } from 'next-seo';
import '@/styles/globals.css';
import { CONFIG } from '@/config';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
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
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossOrigin: 'anonymous',
          },
          {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
          },
        ]}
      />
      <Component {...pageProps} />
    </>
  );
}
