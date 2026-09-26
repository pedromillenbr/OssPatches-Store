import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import LegalPage, { Section, Highlight } from '@/components/legal/LegalPage';
import { COMPANY } from '@/config/company';

const UPDATED_AT = '26 de setembro de 2026';

export default function TrocasEDevolucoesPage() {
  const mail = (
    <a href={`mailto:${COMPANY.email}`} className="link">
      {COMPANY.email}
    </a>
  );

  return (
    <Layout>
      <NextSeo
        title="Trocas e Devoluções"
        description="Prazos e passo a passo para trocar ou devolver um pedido OssPatches: 7 dias de arrependimento, defeitos de fabricação e troca de tamanho."
      />

      <LegalPage
        title="Trocas e Devoluções"
        updatedAt={UPDATED_AT}
        intro={
          <p>
            Nossas faixas e patches são feitos um a um, e queremos que a sua chegue
            do jeito que você imaginou. Se algo não estiver certo, esta página
            explica o que fazer, em quanto tempo e quem paga o quê. As regras aqui
            seguem o Código de Defesa do Consumidor (Lei nº 8.078/1990) — quando a
            lei te der mais direito do que está escrito aqui, vale a lei.
          </p>
        }
      >
        <Section n="1" title="Arrependimento: 7 dias, sem precisar justificar">
          <Highlight>
            Você tem <strong>7 dias corridos, contados do recebimento</strong>, para
            desistir da compra feita pelo site e receber <strong>todo o valor
            pago de volta, inclusive o frete</strong>. Não precisa explicar o
            motivo. É o direito de arrependimento do artigo 49 do CDC.
          </Highlight>
          <p>
            Esse direito vale também para as peças personalizadas com nome, faixa ou
            bordado sob medida. Só pedimos que o produto volte{' '}
            <strong>sem uso e em condições de ser conferido</strong> — ou seja, não
            lavado e sem sinais de treino.
          </p>
          <p>
            A devolução do valor é feita pelo mesmo meio do pagamento, em até 10 dias
            úteis depois de o produto chegar de volta até nós. No cartão, o estorno
            pode aparecer na fatura seguinte, conforme o prazo do seu banco.
          </p>
        </Section>

        <Section n="2" title="Produto com defeito de fabricação">
          <p>
            Bordado solto, costura aberta, tamanho diferente do pedido ou cor errada
            são problemas nossos e resolvemos por nossa conta — frete de ida e volta
            incluído.
          </p>
          <ul>
            <li>
              <strong>Prazo para reclamar:</strong> 90 dias a partir do recebimento
              (artigo 26 do CDC, produto durável).
            </li>
            <li>
              <strong>O que fazemos:</strong> consertamos, trocamos por uma peça nova
              ou devolvemos o valor — a escolha é sua.
            </li>
            <li>
              <strong>Prazo para resolver:</strong> até 30 dias a partir do
              recebimento da peça de volta.
            </li>
          </ul>
          <p>
            Desgaste natural do uso, descoloração por lavagem fora das instruções e
            danos causados por acidente não contam como defeito de fabricação.
          </p>
        </Section>

        <Section n="3" title="Troca de tamanho">
          <p>
            Errou o tamanho da faixa? Dentro dos mesmos 7 dias do recebimento,
            trocamos por outro tamanho sem custo de produto — você paga só o frete de
            envio da peça de volta, e nós pagamos o frete da nova peça até você.
          </p>
          <p>
            Antes de comprar, vale conferir a tabela de medidas na página do produto:
            ela é a mesma que usamos na produção.
          </p>
        </Section>

        <Section n="4" title="Como solicitar">
          <ul>
            <li>
              <strong>1.</strong> Escreva para {mail} com o número do pedido (formato
              OSS-000000-XXXXXXXX) e o que aconteceu. Se for defeito, mande fotos —
              agiliza muito.
            </li>
            <li>
              <strong>2.</strong> Respondemos em até 2 dias úteis com a autorização e
              as instruções de postagem.
            </li>
            <li>
              <strong>3.</strong> Poste a peça com a embalagem que combinarmos e nos
              envie o código de rastreio.
            </li>
            <li>
              <strong>4.</strong> Assim que recebermos e conferirmos, damos andamento
              à troca ou ao estorno.
            </li>
          </ul>
          <p>
            Não envie a peça de volta antes de receber a autorização: sem ela não
            conseguimos identificar de quem é o pacote.
          </p>
        </Section>

        <Section n="5" title="Pedidos internacionais">
          <p>
            Para entregas fora do Brasil, os mesmos direitos valem, mas o transporte
            de retorno é mais caro e demorado. Nesses casos, fale com a gente por{' '}
            {mail} antes de postar: quase sempre encontramos uma solução melhor do
            que mandar a peça de volta atravessando o mundo. Impostos e taxas
            alfandegárias cobrados no país de destino não são reembolsáveis por nós.
          </p>
        </Section>

        <Section n="6" title="Ainda com dúvida?">
          <p>
            Fale com a gente por {mail}. Uma pessoa de verdade responde — e se o
            problema foi nosso, a gente conserta.
          </p>
        </Section>
      </LegalPage>
    </Layout>
  );
}
