import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import LegalPage, { Section } from '@/components/legal/LegalPage';
import { COMPANY, companyAddressLine } from '@/config/company';

const UPDATED_AT = '26 de setembro de 2026';

export default function TermosDeUsoPage() {
  const mail = (
    <a href={`mailto:${COMPANY.email}`} className="link">
      {COMPANY.email}
    </a>
  );

  return (
    <Layout>
      <NextSeo
        title="Termos de Uso"
        description="Condições de compra e uso do site da OssPatches: pedidos, preços, pagamento, prazos de produção e entrega."
      />

      <LegalPage
        title="Termos de Uso"
        updatedAt={UPDATED_AT}
        intro={
          <p>
            Estes termos valem para quem navega e compra no site da OssPatches. Ao
            finalizar um pedido, você concorda com as condições abaixo. Escrevemos
            em linguagem direta de propósito: você precisa entender o que está
            contratando sem precisar de advogado.
          </p>
        }
      >
        <Section n="1" title="Quem é a OssPatches">
          <p>
            Loja de faixas e patches de Jiu-Jitsu com produção própria, operando o
            site osspatches.com.
          </p>
          <ul>
            {COMPANY.legalName && (
              <li>
                <strong>Razão social:</strong> {COMPANY.legalName}
              </li>
            )}
            {COMPANY.cnpj && (
              <li>
                <strong>CNPJ:</strong> {COMPANY.cnpj}
              </li>
            )}
            <li>
              <strong>Endereço:</strong> {companyAddressLine()}
            </li>
            <li>
              <strong>Atendimento:</strong> {mail}
            </li>
          </ul>
        </Section>

        <Section n="2" title="Conta de cliente">
          <p>
            Você pode comprar como convidado ou criar uma conta. Com conta, você
            acompanha seus pedidos e guarda seus interesses. Os dados que você
            informa devem ser verdadeiros e atualizados — endereço ou CPF errados
            impedem a entrega e a emissão da nota.
          </p>
          <p>
            A senha é pessoal. Se desconfiar que alguém teve acesso à sua conta,
            troque a senha e avise a gente por {mail}. Podemos suspender contas
            usadas para fraude, revenda não autorizada ou qualquer uso que
            prejudique outros clientes.
          </p>
        </Section>

        <Section n="3" title="Produtos personalizados">
          <p>
            A maior parte das nossas peças é feita sob encomenda, com o nome, a
            graduação e as cores que você escolhe. Por isso:
          </p>
          <ul>
            <li>
              <strong>Confira o texto antes de finalizar.</strong> O bordado sai
              exatamente como digitado, incluindo acentos e maiúsculas. O preview na
              página do produto mostra o resultado real.
            </li>
            <li>
              <strong>Pequenas variações são normais.</strong> Tons de linha e
              posicionamento podem ter diferença mínima em relação à foto, por ser
              produção artesanal. Isso não caracteriza defeito.
            </li>
            <li>
              Alterações no pedido só são possíveis enquanto a produção não começou.
              Fale com a gente o quanto antes.
            </li>
          </ul>
        </Section>

        <Section n="4" title="Preços e pagamento">
          <p>
            Os preços aparecem no site em reais (BRL) para pedidos no Brasil e em
            dólar (USD) para pedidos internacionais, e podem mudar a qualquer
            momento — vale sempre o preço que estava na tela quando você finalizou o
            pedido.
          </p>
          <ul>
            <li>
              <strong>Brasil:</strong> Pix e cartão de crédito, processados pelo
              Mercado Pago.
            </li>
            <li>
              <strong>Internacional:</strong> PayPal.
            </li>
          </ul>
          <p>
            Não guardamos dados do seu cartão. O pedido só entra em produção depois
            da confirmação do pagamento. Se o pagamento for recusado ou não
            confirmado, o pedido é cancelado automaticamente.
          </p>
          <p>
            Cupons de desconto têm validade e condições próprias, não são
            cumulativos entre si e podem ser encerrados a qualquer momento.
          </p>
        </Section>

        <Section n="5" title="Prazos de produção e entrega">
          <p>
            O prazo total é <strong>produção + transporte</strong>. O prazo de
            transporte é o que a transportadora informa no checkout, calculado pelo
            seu CEP, e começa a contar a partir da postagem — não da compra.
          </p>
          <p>
            Atrasos da transportadora, endereço incompleto e ausência no momento da
            entrega estão fora do nosso controle, mas ajudamos a resolver: escreva
            para {mail} com o número do pedido.
          </p>
          <p>
            Em pedidos internacionais, impostos e taxas alfandegárias do país de
            destino são de responsabilidade de quem compra, e são cobrados na
            entrega pelo próprio país.
          </p>
        </Section>

        <Section n="6" title="Cancelamento, trocas e devoluções">
          <p>
            Você tem 7 dias corridos, contados do recebimento, para desistir da
            compra e receber tudo de volta, inclusive o frete. Os prazos e o passo a
            passo estão na página{' '}
            <Link href="/trocas-e-devolucoes" className="link">
              Trocas e Devoluções
            </Link>
            , que faz parte destes termos.
          </p>
        </Section>

        <Section n="7" title="Uso do site e conteúdo">
          <p>
            A marca OssPatches, o logotipo, as fotos, os textos e o design do site
            são nossos e não podem ser copiados ou usados comercialmente sem
            autorização por escrito.
          </p>
          <p>
            Ao enviar uma arte ou imagem para personalização, você declara que tem o
            direito de usá-la. Podemos recusar pedidos com conteúdo de terceiros sem
            autorização, ou com conteúdo ofensivo, discriminatório ou ilegal.
          </p>
          <p>
            Avaliações publicadas por clientes passam por moderação. Podemos não
            publicar textos ofensivos, com dados pessoais de terceiros ou sem
            relação com o produto — mas nunca removemos uma avaliação só por ser
            negativa.
          </p>
        </Section>

        <Section n="8" title="Privacidade">
          <p>
            O tratamento dos seus dados está explicado na{' '}
            <Link href="/politica-de-privacidade" className="link">
              Política de Privacidade
            </Link>
            , que também faz parte destes termos.
          </p>
        </Section>

        <Section n="9" title="Mudanças nestes termos">
          <p>
            Podemos atualizar estes termos para refletir mudanças na loja ou na
            legislação. A data de atualização fica sempre no topo da página, e o
            pedido já feito continua regido pela versão vigente no dia da compra.
          </p>
        </Section>

        <Section n="10" title="Lei aplicável e foro">
          <p>
            Estes termos seguem a lei brasileira. Para resolver qualquer questão,
            fale primeiro com a gente por {mail} — quase tudo se resolve por
            conversa. Não sendo possível, fica eleito o foro do domicílio do
            consumidor, conforme o Código de Defesa do Consumidor, ou a comarca de{' '}
            {COMPANY.jurisdiction} nos demais casos.
          </p>
        </Section>
      </LegalPage>
    </Layout>
  );
}
