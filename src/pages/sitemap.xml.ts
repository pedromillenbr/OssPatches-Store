import { GetServerSideProps } from 'next';
import { getAllSlugs } from '@/services/products';
import { CONFIG } from '@/config';

// Só entram páginas que existem de verdade: uma URL listada aqui sem página
// correspondente vira erro 404 no Google Search Console e derruba a confiança
// do site no buscador.
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/quem-somos', priority: '0.6', changefreq: 'monthly' },
  { path: '/nossos-atletas', priority: '0.5', changefreq: 'monthly' },
  { path: '/envios', priority: '0.5', changefreq: 'monthly' },
  { path: '/trocas-e-devolucoes', priority: '0.4', changefreq: 'yearly' },
  { path: '/termos-de-uso', priority: '0.3', changefreq: 'yearly' },
  { path: '/politica-de-privacidade', priority: '0.3', changefreq: 'yearly' },
];

function buildSitemap(urls: { loc: string; priority: string; changefreq: string; lastmod: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority, changefreq, lastmod }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export default function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const lastmod = new Date().toISOString().split('T')[0];

  const staticUrls = STATIC_PAGES.map(({ path, priority, changefreq }) => ({
    loc: `${CONFIG.siteUrl}${path}`,
    priority,
    changefreq,
    lastmod,
  }));

  const productSlugs = getAllSlugs();
  const productUrls = productSlugs.map((slug) => ({
    loc: `${CONFIG.siteUrl}/produtos/${slug}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod,
  }));

  const sitemap = buildSitemap([...staticUrls, ...productUrls]);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
};
