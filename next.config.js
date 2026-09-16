/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    // Proxy do Supabase pelo nosso próprio domínio. O navegador chama
    // /sb-api/... (mesma origem) e o Next.js encaminha internamente para o
    // Supabase. Isso evita que o Brave/bloqueadores barrem a conexão por
    // considerarem o domínio do Supabase um "terceiro".
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];
    return [
      { source: '/sb-api/:path*', destination: `${supabaseUrl}/:path*` },
    ];
  },
  async headers() {
    // Domains used by the app that must be whitelisted in CSP
    const mpDomains = 'https://*.mercadopago.com https://*.mercadolibre.com https://*.mercadopago.com.br';
    const gaDomains = 'https://*.google-analytics.com https://*.googletagmanager.com https://www.google.com';
    const fontDomains = 'https://fonts.googleapis.com https://fonts.gstatic.com';
    // Supabase (login/conta): auth, banco e storage de avatares. Sem isto no
    // connect-src, o navegador bloqueia a conexão ("Failed to fetch").
    const supabaseDomains = 'https://*.supabase.co wss://*.supabase.co';

    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${gaDomains} ${mpDomains}`,
      `style-src 'self' 'unsafe-inline' ${fontDomains}`,
      `font-src 'self' data: ${fontDomains}`,
      `img-src 'self' data: blob: https: http:`,
      `connect-src 'self' ${mpDomains} ${gaDomains} ${supabaseDomains} https://viacep.com.br https://sandbox.melhorenvio.com.br https://melhorenvio.com.br https://api.resend.com`,
      `frame-src 'self' ${mpDomains}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
