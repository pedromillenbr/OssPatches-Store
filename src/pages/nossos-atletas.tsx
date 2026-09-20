import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Layout from '@/components/layout/Layout';
import AthleteCard from '@/components/athletes/AthleteCard';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import athletes from '@/data/team.json';
import { CONFIG } from '@/config';

export default function AthletesPage() {
  return (
    <>
      <NextSeo
        title="Nossos Atletas | OssPatches"
        description="Conheça os atletas que vestem OssPatches. Campeões brasileiros e mundiais de Jiu-Jitsu."
        canonical={`${CONFIG.siteUrl}/nossos-atletas`}
        openGraph={{
          url: `${CONFIG.siteUrl}/nossos-atletas`,
          title: 'Nossos Atletas | OssPatches',
          description:
            'Conheça os atletas que vestem OssPatches. Campeões brasileiros e mundiais de Jiu-Jitsu.',
          type: 'website',
        }}
      />

      <Layout>
        <main className="min-h-screen bg-white relative">
          <AnimatedBackground />
          {/*
            Título e grade vivem na mesma seção. Antes havia um hero "Nossos
            Atletas" com botão "Ver atletas" e, logo abaixo, um segundo título
            "Conheça nossos atletas" dizendo a mesma coisa — duas telas de
            rolagem no celular antes de ver a primeira foto.
          */}
          <section id="atletas" className="relative z-10 container-site py-10 sm:py-16 lg:py-20">
            <div className="max-w-2xl mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 bg-brand-gray-100 px-3 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                <span className="text-xs font-semibold tracking-widest uppercase text-brand-gray-700">
                  Equipe de elite
                </span>
              </div>

              <h1 className="text-[2.25rem] sm:text-5xl lg:text-6xl font-black text-brand-black leading-[1.05] mb-5">
                Nossos Atletas
              </h1>

              <p className="text-lg text-brand-gray-600 leading-relaxed">
                Campeões de Jiu-Jitsu e Judô que confiam na OssPatches para suas
                competições e treinos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {athletes.athletes
                .filter((athlete) => !('hidden' in athlete && athlete.hidden))
                .map(({ id, name, title, category, image, bio, achievements }) => (
                  <AthleteCard
                    key={id}
                    name={name}
                    title={title}
                    category={category}
                    image={image}
                    bio={bio}
                    achievements={achievements}
                  />
                ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative z-10 container-site py-12 sm:py-20 border-t border-brand-gray-200">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-4">
                Comece hoje
              </p>
              <h2 className="text-3xl sm:text-5xl font-black text-brand-black mb-6 leading-tight">
                Você também pode ser campeão
              </h2>
              <p className="text-lg text-brand-gray-600 leading-relaxed mb-10">
                Nossas faixas e patches são usados por atletas de elite em todo o mundo. Comece sua
                jornada com OssPatches.
              </p>
              <Link href="/#faixas-adulto">
                <Button size="lg">
                  Ver faixas e patches
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </Layout>
    </>
  );
}
