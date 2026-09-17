import { useState, useEffect, useRef } from 'react';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Layout from '@/components/layout/Layout';
import GlobalPresence from '@/components/about/GlobalPresence';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Emoji from '@/components/ui/Emoji';
import { CONFIG } from '@/config';

function TimelineImage({ src, alt, year, position }: { src: string; alt: string; year: string; position?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="w-full h-80 bg-brand-gray-100 rounded-xl flex items-center justify-center shadow-md text-brand-gray-400">
        <span className="text-2xl font-black">{year}</span>
      </div>
    );
  }
  return (
    <div className="relative w-full h-80 bg-brand-gray-100 rounded-xl overflow-hidden shadow-md">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
        style={position ? { objectPosition: position } : undefined}
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  );
}

type TimelinePhoto = { src: string; alt: string };

// Duas fotos: a principal ocupa o quadro e a segunda entra como detalhe sobreposto no canto
function TimelineImagePair({ main, detail, year, isLeft }: { main: TimelinePhoto; detail: TimelinePhoto; year: string; isLeft: boolean }) {
  const [detailError, setDetailError] = useState(false);
  return (
    <div className="relative pb-10 sm:pb-12">
      {/* foco à direita: no celular o quadro corta as laterais e o Jefferson fica na ponta direita da foto */}
      <TimelineImage src={encodeURI(main.src)} alt={main.alt} year={year} position="72% 45%" />
      {!detailError && (
        <div
          className={`absolute bottom-0 w-[46%] aspect-[3/2] rounded-xl overflow-hidden bg-brand-gray-100 ring-4 ring-white shadow-xl ${
            isLeft ? '-left-2 sm:-left-5' : '-right-2 sm:-right-5'
          }`}
        >
          <Image
            src={encodeURI(detail.src)}
            alt={detail.alt}
            fill
            sizes="(max-width: 1024px) 46vw, 23vw"
            className="object-cover"
            loading="lazy"
            onError={() => setDetailError(true)}
          />
        </div>
      )}
    </div>
  );
}

function TimelineEntry({
  year, title, description, icon, image, secondImage, index,
}: {
  year: string; title: string; description: string; icon: string;
  image: TimelinePhoto; secondImage?: TimelinePhoto; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isLeft = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        transitionDelay: '0.1s',
      }}
    >
      {/* Content */}
      <div className={isLeft ? 'lg:order-1' : 'lg:order-2'}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center shrink-0 shadow-md">
            <Emoji char={icon} size={18} />
          </div>
          <span className="text-xl font-black text-orange-600">{year}</span>
        </div>
        <h3 className="text-2xl lg:text-3xl font-black text-brand-black mb-3 leading-tight">
          {title}
        </h3>
        <p className="text-brand-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Image */}
      <div className={isLeft ? 'lg:order-2' : 'lg:order-1'}>
        {secondImage ? (
          <TimelineImagePair main={image} detail={secondImage} year={year} isLeft={isLeft} />
        ) : (
          <TimelineImage src={image.src} alt={image.alt} year={year} />
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const galleryImages = [
    { id: 1, src: '/images/about/historia-1.jpg', alt: 'História OssPatches 2015' },
    { id: 2, src: '/images/about/historia-2.jpeg', alt: 'História OssPatches 2017' },
    { id: 3, src: '/images/about/jeff oab.jpeg', alt: 'Equipe OssPatches no plenário da OAB-RJ durante o reconhecimento da campanha contra o assédio nos tatames' },
    { id: 4, src: '/images/about/patches oab.jpeg', alt: 'Patches da campanha "Contra o assédio nos tatames"' },
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
      title: 'Momento de Expansão',
      description: 'Expandimos nossa produção e começamos a estar presentes nos principais campeonatos do Brasil. Sempre com nossas barracas divulgando a excelente qualidade do nosso material.',
      icon: '🚀',
      image: galleryImages[1]
    },
    {
      year: '2026',
      title: 'Visibilidade Nacional',
      description: 'Nossa campanha "Contra o assédio nos tatames" ganhou reconhecimento público da OAB-RJ. Levamos ao plenário da Ordem a mensagem de que o tatame precisa ser um lugar seguro para todos, e transformamos essa causa em patches usados por atletas e academias.',
      icon: '⚖️',
      image: galleryImages[2],
      secondImage: galleryImages[3],
    },
  ];

  return (
    <>
      <NextSeo
        title="Quem Somos | OssPatches"
        description="Conheça a história de OssPatches, nossa missão de levar qualidade aos atletas de Jiu-Jitsu em todo o mundo."
        canonical={`${CONFIG.siteUrl}/quem-somos`}
        openGraph={{
          url: `${CONFIG.siteUrl}/quem-somos`,
          title: 'Quem Somos | OssPatches',
          description: 'Conheça a história de OssPatches e nossa missão pelo Jiu-Jitsu.',
          type: 'website',
        }}
      />

      <Layout>
        <main className="min-h-screen bg-white relative">
          <AnimatedBackground />
          {/* 1. Nossa História */}
          <section className="relative z-10 container-site py-20 lg:py-28 border-b border-brand-gray-200">
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

              {/* Image — galpão / sede da OssPatches */}
              <div className="w-full h-96 bg-brand-gray-100 rounded-lg overflow-hidden">
                <Image
                  src="/images/about/galpao-osspatches.jpg"
                  alt="Galpão da OssPatches — nossa sede de produção"
                  width={1300}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* 2. Scroll Timeline */}
          <section className="relative z-10 py-20 lg:py-28 border-b border-brand-gray-200">
            {/* Header */}
            <div className="container-site mb-16">
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

            {/* Timeline wrapper — linha central só no desktop */}
            <div className="relative">
              {/* Linha vertical central */}
              <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500 via-orange-300 to-transparent" />

              {/* Bolinha pulsante no topo da linha */}
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 -top-3 z-10 items-center justify-center">
                <span className="absolute w-6 h-6 rounded-full bg-orange-400 opacity-40 animate-ping" />
                <span className="relative w-3 h-3 rounded-full bg-orange-500 ring-4 ring-white" />
              </div>

              {/* Entries */}
              <div className="container-site space-y-20 pt-6">
                {milestones.map((milestone, i) => (
                  <div key={i} className="relative">
                    {/* Bolinha na linha — só desktop */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-5 z-10 w-5 h-5 rounded-full bg-white border-2 border-orange-500 items-center justify-center shadow-sm" />

                    <TimelineEntry
                      index={i}
                      year={milestone.year}
                      title={milestone.title}
                      description={milestone.description}
                      icon={milestone.icon}
                      image={milestone.image}
                      secondImage={'secondImage' in milestone ? milestone.secondImage : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Presença Global */}
          <div className="relative z-10">
            <GlobalPresence />
          </div>

          {/* CTA Final */}
          <section className="relative z-10 container-site py-20 lg:py-28 border-t border-brand-gray-200">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-4">
                Comece hoje
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-brand-black mb-6 leading-tight">
                Faça parte dessa história
              </h2>
              <p className="text-lg text-brand-gray-600 leading-relaxed mb-10">
                Junte-se a milhares de atletas que já confiam em OssPatches para sua jornada no Jiu-Jitsu.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/">
                  <Button size="lg">
                    Explorar produtos
                  </Button>
                </Link>
                <Link href="/nossos-atletas">
                  <Button size="lg" variant="ghost">
                    Conhecer os atletas →
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </Layout>
    </>
  );
}
