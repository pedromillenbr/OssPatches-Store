import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';

export default function PoliticaEnvios() {
  return (
    <Layout>
      <Head>
        <title>Política de Envios | OssPatches</title>
        <meta
          name="description"
          content="Informações sobre prazos, transportadoras e rastreamento de pedidos OssPatches."
        />
      </Head>

      <div className="container-site py-16 max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-black mb-4">
            Política de Envios
          </h1>
          <p className="text-brand-gray-500 text-lg">
            Tudo o que você precisa saber sobre o envio do seu pedido.
          </p>
        </div>

        {/* Prazo */}
        <section className="mb-10">
          <div className="flex items-start gap-4 bg-brand-black text-white rounded-2xl p-6">
            <div className="text-4xl">📦</div>
            <div>
              <h2 className="text-xl font-bold mb-1">Prazo de Envio</h2>
              <p className="text-brand-gray-300 leading-relaxed">
                Todos os pedidos são produzidos sob demanda com o mais alto
                padrão de qualidade. Após a confirmação do pagamento, seu
                pedido é despachado em <strong className="text-white">até 7 dias úteis</strong>.
                Você receberá o código de rastreamento assim que a encomenda
                for postada.
              </p>
            </div>
          </div>
        </section>

        {/* Transportadoras */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-black mb-6">
            Nossas Transportadoras
          </h2>
          <p className="text-brand-gray-500 mb-6 leading-relaxed">
            Trabalhamos com as melhores transportadoras do mercado para
            garantir que seu pedido chegue com segurança e agilidade, seja
            no Brasil ou no exterior.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Loggi */}
            <div className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4 hover:shadow-md transition-shadow">
              <div className="relative w-40 h-14">
                <Image
                  src="/images/shipping/loggi-logo.png"
                  alt="Loggi"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-brand-gray-500 text-center">
                Entregas expressas no Brasil com rastreamento em tempo real.
              </p>
              <a
                href="https://www.loggi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#00BFFF] hover:underline"
              >
                Rastrear pedido Loggi →
              </a>
            </div>

            {/* J&T Express */}
            <div className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4 hover:shadow-md transition-shadow">
              <div className="relative w-40 h-14">
                <Image
                  src="/images/shipping/jt-logo.png"
                  alt="J&T Express"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-brand-gray-500 text-center">
                Cobertura nacional e internacional com alto volume e confiabilidade.
              </p>
              <a
                href="https://www.jtexpress.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#E30613] hover:underline"
              >
                Rastrear pedido J&T →
              </a>
            </div>
          </div>
        </section>

        {/* Informações adicionais */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-black mb-6">
            Informações Importantes
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-brand-black flex-shrink-0" />
              <p className="text-brand-gray-500 leading-relaxed">
                <strong className="text-brand-black">Prazo de entrega:</strong>{' '}
                O prazo de entrega varia conforme a região de destino e começa a
                contar a partir do despacho, não da data do pedido.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-brand-black flex-shrink-0" />
              <p className="text-brand-gray-500 leading-relaxed">
                <strong className="text-brand-black">Código de rastreamento:</strong>{' '}
                Enviado automaticamente por Whatsapp assim que a encomenda for
                postada na transportadora.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-brand-black flex-shrink-0" />
              <p className="text-brand-gray-500 leading-relaxed">
                <strong className="text-brand-black">Envio internacional:</strong>{' '}
                Enviamos para qualquer país. Taxas alfandegárias do país
                destinatário são de responsabilidade do comprador.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-brand-black flex-shrink-0" />
              <p className="text-brand-gray-500 leading-relaxed">
                <strong className="text-brand-black">Endereço incorreto:</strong>{' '}
                Verifique sempre o endereço de entrega antes de finalizar o
                pedido. Reenvios por endereço incorreto podem gerar custos
                adicionais.
              </p>
            </li>
          </ul>
        </section>

        {/* CTA Dúvidas */}
        <section className="bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-brand-black mb-2">
            Ficou com alguma dúvida?
          </h3>
          <p className="text-brand-gray-500 mb-5">
            Nossa equipe está pronta para te ajudar pelo WhatsApp.
          </p>
          <a
            href="https://wa.me/5521982479922?text=Ol%C3%A1%21+Vim+pelo+site+OssPatches+e+tenho+uma+d%C3%BAvida+sobre+envio."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Falar no WhatsApp
          </a>
        </section>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-brand-gray-400 hover:text-brand-black transition-colors">
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    </Layout>
  );
}
