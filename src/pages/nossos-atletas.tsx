import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Layout from '@/components/layout/Layout';
import AthleteCard from '@/components/athletes/AthleteCard';
import athletes from '@/data/team.json';

export default function AthletesPage() {
  return (
    <>
      <NextSeo
        title="Nossos Atletas | OssPatches"
        description="Conheça os atletas que vestem OssPatches. Campeões brasileiros e mundiais de Jiu-Jitsu."
        canonical="https://osspatches.com.br/nossos-atletas"
        openGraph={{
          url: 'https://osspatches.com.br/nossos-atletas',
          title: 'Nossos Atletas | OssPatches',
          description:
            'Conheça os atletas que vestem OssPatches. Campeões brasileiros e mundiais de Jiu-Jitsu.',
          type: 'website',
        }}
      />

      <Layout>
        <main className="min-h-screen bg-white">
          {/* Hero */}
          <section className="border-b border-brand-gray-200">
            <div className="container-site py-20 lg:py-28">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-brand-gray-100 px-3 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-brand-gray-700">
                    Os melhores
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-black leading-[1.05] mb-6">
                  Nossos Atletas
                </h1>

                <p className="text-lg text-brand-gray-600 leading-relaxed mb-8 max-w-md">
                  Campeões de Jiu-Jitsu que confiam na OssPatches para
                  suas competições e treinos.
                </p>

                <Link href="#atletas">
                  <Button size="lg">Ver atletas</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Athletes Grid */}
          <section id="atletas" className="container-site py-20 lg:py-28">
            <div className="mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-4">
                Equipe de elite
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-4">
                Conheça nossos atletas
              </h2>
              <p className="text-brand-gray-600 max-w-2xl">
                Cada um deles representa excelência, dedicação e a qualidade que OssPatches oferece.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {athletes.athletes.map((athlete) => (
                <AthleteCard key={athlete.id} {...athlete} />
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="container-site py-20 lg:py-28 border-t border-brand-gray-200">
            <div className="bg-brand-black text-white rounded-lg p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Você também pode ser campeão</h2>
              <p className="text-brand-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Nossas faixas e patches são usados por atletas de elite em todo o mundo. Comece sua
                jornada com OssPatches.
              </p>
              <Link href="/#faixas-adulto">
                <Button size="lg" variant="secondary" fullWidth className="sm:w-auto">
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
