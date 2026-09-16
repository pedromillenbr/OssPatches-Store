import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Favicon — símbolo da águia em preto (visível na aba clara do navegador) */}
        <link rel="icon" href="/images/brand/aguia-simbolo.svg" type="image/svg+xml" />
        <link rel="icon" href="/images/brand/aguia-simbolo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/images/brand/aguia-simbolo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
