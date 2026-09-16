import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Favicon — emblema da águia (SVG: nítido em qualquer tamanho) */}
        <link rel="icon" href="/images/brand/emblema-aguia.svg" type="image/svg+xml" />
        <link rel="icon" href="/images/brand/emblema-aguia.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/images/brand/emblema-aguia.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
