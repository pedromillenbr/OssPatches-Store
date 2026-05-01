import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Layout from '@/components/layout/Layout';
import GlobalPresence from '@/components/about/GlobalPresence';

export default function AboutPage() {
  const galleryImages = [
    { id: 1, src: '/images/about/historia-1.jpg', alt: 'História OssPatches 2015' },
    { id: 2, src: '/images/about/historia-2.jpg', alt: 'História OssPatches 2017' },
    { id: 3, src: '/images/about/historia-3.jpg', alt: 'História OssPatches 2019' },
    { id: 4, src: '/images/about/historia-4.jpg', alt: 'História OssPatches 2023' },
  ];

  const milestones = [
    {
      year: '2015',
      title: 'O Início',
      description: 'OssPatches foi fundada em uma pequena oficina com uma visão clara: oferecer faixas e patches de qualidade premium para atletas de Jiu-Jitsu.',
      icon: '🌱',
      image: galleryImages[0]
    },
    {
      year: '2017',
      title: 'Primeiro Crescimento',
      description: 'Expandimos nossa produção e começamos a atender atletas em diferentes estados do Brasil com qualidade reconhecida.',
      icon: '🚀',
      image: galleryImages[1]
    },
    {
      year: '2019',
      title: 'Alcance Global',
      description: 'Primeira exportação internacional. OssPatches passa a ser conhecida por atletas em países da Europa e Ásia.',
      icon: '🌍',
      image: galleryImages[2]
    },
    {
      year: '2023',
      title: 'Consolidação',
      description: 'Mais de 12.000 atletas em 6 continentes confiam em OssPatches para suas faixas e patches premium.',
      icon: '🏆',
      image: galleryImages[3]
    },
  ];

  return (
    <>
      <NextSeo
        title="Quem Somos | OssPatches"
        description="Conheça a história de OssPatches, nossa missão de levar qualidade aos atletas de Jiu-Jitsu em todo o mundo."
        canonical="https://osspatches.com.br/quem-somos"
        openGraph={{
          url: 'https://osspatches.com.br/quem-somos',
          title: 'Quem Somos | OssPatches',
          description: 'Conheça a história de OssPatches e nossa missão pelo Jiu-Jitsu.',
          type: 'website',
        }}
      />

      <Layout>
        <main className="min-h-screen bg-white">
          {/* 1. Nossa História */}
          <section className="container-site py-20 lg:py-28 border-b border-brand-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <div className="inline-flex items-center gap-2 bg-brand-gray-100 px-3 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-brand-gray-700">
                    Quem Somos
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl font-black text-brand-black mb-6 leading-tight">
                  De um tatame no Rio de Janeiro para o mundo
                </h1>

                <div className="space-y-4 text-brand-gray-600 leading-relaxed">
                  <p>
                    A OssPatches nasceu quando percebemos um problema claro:
                    o <strong>atleta comum de Jiu-Jitsu não tinha acesso a produtos realmente bons</strong> — ou pagava caro demais, ou aceitava qualidade ruim.
                  </p>

                  <p>
                    Começamos pequenos, com produção própria e controle total de cada etapa. <strong>Nada terceirizado, nada genérico.</strong> Cada faixa, cada patch, cada detalhe passa pelas nossas mãos — porque acreditamos que quem treina todos os dias merece um equipamento à altura.
                  </p>

                  <p>
                    Não importa se você compete ou só quer evoluir no treino: <strong>qualidade não deveria ser um privilégio.</strong> Hoje, a OssPatches atende atletas em mais de 10 países. A estrutura cresceu. Mas o princípio continua o mesmo: <strong>só sai daqui o que a gente usaria no nosso próprio treino.</strong>
                  </p>
                </div>
              </div>

              {/* Image */}
              <div className="w-full h-96 bg-brand-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center text-brand-gray-400">
                  <p className="text-lg font-semibold mb-2">Nossa Jornada</p>
                  <p className="text-sm">Adicione sua foto representativa aqui</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Timeline + Galeria Integradas */}
          <section className="container-site py-20 lg:py-28 border-b border-brand-gray-200">
            <div className="mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-4">
                Nossa trajetória
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-brand-black mb-4 leading-tight">
                Do Início até Hoje
              </h2>
              <p className="text-lg text-brand-gray-600 max-w-2xl leading-relaxed">
                Uma jornada de paixão, dedicação e qualidade no Jiu-Jitsu.
              </p>
            </div>

            {/* Timeline alternado com galeria */}
            <div className="space-y-16">
              {milestones.map((milestone, i) => (
                <div key={i} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Conteúdo - muda de lado alternado */}
                  <div className={i % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}>
                    <div className="relative pl-8">
                      {/* Linha vertical */}
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-600 to-orange-300" />

                      {/* Círculo da timeline */}
                      <div className="absolute -left-4 top-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {milestone.icon}
                      </div>

                      {/* Conteúdo */}
                      <p className="text-2xl font-black text-orange-600 mb-2">
                        {milestone.year}
                      </p>
                      <h3 className="text-3xl font-black text-brand-black mb-4 leading-tight">
                        {milestone.title}
                      </h3>
                      <p className="text-brand-gray-600 leading-relaxed text-lg">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Imagem - muda de lado alternado */}
                  <div className={i % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="w-full h-96 bg-brand-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src={milestone.image.src}
                        alt={milestone.image.alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23E5E7EB" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%236B7280" text-anchor="middle" dy=".3em"%3E' + milestone.year + '%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Presença Global */}
          <GlobalPresence />

          {/* CTA Final */}
          <section className="container-site py-20 lg:py-28 border-t border-brand-gray-200">
            <div className="bg-brand-black text-white rounded-lg p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Faça parte dessa história</h2>
              <p className="text-brand-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Junte-se a milhares de atletas que já confiam em OssPatches para sua jornada no Jiu-Jitsu.
              </p>
              <Link href="/">
                <Button size="lg" variant="secondary" fullWidth className="sm:w-auto">
                  Explorar produtos
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </Layout>
    </>
  );
}
