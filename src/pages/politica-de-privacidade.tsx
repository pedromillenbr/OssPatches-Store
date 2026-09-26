import { NextSeo } from 'next-seo';
import Layout from '@/components/layout/Layout';
import LegalPage, { Section } from '@/components/legal/LegalPage';
import { COMPANY } from '@/config/company';

const UPDATED_AT = '16 de setembro de 2026';
const CONTACT_EMAIL = COMPANY.email;

export default function PoliticaDePrivacidadePage() {
  return (
    <Layout>
      <NextSeo
        title="Política de Privacidade"
        description="Como a OssPatches coleta, usa e protege seus dados pessoais, de acordo com a LGPD."
      />

      <LegalPage
        title="Política de Privacidade"
        updatedAt={UPDATED_AT}
        intro={
          <p>
            Esta política explica, em linguagem direta, quais dados a OssPatches
            coleta quando você usa nosso site, por que os coletamos e quais são os
            seus direitos. Tratamos seus dados de acordo com a Lei Geral de
            Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        }
      >
        <Section n="1" title="Quem somos">
          <p>
            A OssPatches é uma loja de faixas e patches de Jiu-Jitsu com produção
            própria. Para tratar dúvidas sobre privacidade e seus dados, fale
            conosco pelo e-mail{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              {CONTACT_EMAIL}
            </a>
            . Esse é também o canal do nosso Encarregado de Dados (DPO).
          </p>
        </Section>

        <Section n="2" title="Quais dados coletamos">
          <p>Coletamos apenas o necessário para vender e entregar seus produtos:</p>
          <ul>
            <li>
              <strong>Dados de cadastro</strong> (quando você cria uma conta): nome,
              e-mail, senha (armazenada de forma criptografada) e, opcionalmente,
              telefone e foto de perfil.
            </li>
            <li>
              <strong>Dados de pedido e entrega</strong>: nome, CPF (para pedidos no
              Brasil), endereço, e-mail e telefone.
            </li>
            <li>
              <strong>Dados de pagamento</strong>: processados diretamente pelos
              nossos parceiros de pagamento. <em>Não</em> armazenamos números de
              cartão em nossos servidores.
            </li>
            <li>
              <strong>Dados de navegação</strong>: páginas visitadas e informações
              técnicas (tipo de dispositivo, aproximação de localização por IP),
              coletadas via cookies e ferramentas de análise.
            </li>
            <li>
              <strong>Seus interesses</strong>: produtos que você marca para comprar
              depois, salvos na sua conta.
            </li>
          </ul>
        </Section>

        <Section n="3" title="Como usamos seus dados">
          <ul>
            <li>Processar, produzir e entregar seus pedidos.</li>
            <li>Calcular frete e emitir etiquetas de envio.</li>
            <li>Enviar confirmações e atualizações sobre seus pedidos.</li>
            <li>
              Lembrar você de um carrinho que ficou para trás. Se você informar seu
              e-mail no checkout e não concluir a compra, guardamos o que estava no
              carrinho e enviamos <strong>um único</strong> lembrete. Todo lembrete
              traz um link para cancelar, e cancelar não afeta os e-mails sobre
              pedidos que você já fez.
            </li>
            <li>Manter sua conta, histórico de pedidos e lista de interesses.</li>
            <li>Melhorar o site e entender como ele é usado.</li>
            <li>Cumprir obrigações legais e fiscais.</li>
          </ul>
        </Section>

        <Section n="4" title="Base legal">
          <p>
            Tratamos seus dados com base na <strong>execução do contrato</strong> de
            compra e venda, no <strong>cumprimento de obrigações legais</strong>
            (fiscais e de defesa do consumidor), no nosso{' '}
            <strong>legítimo interesse</strong> de melhorar o serviço, prevenir
            fraudes e retomar uma compra que você mesmo iniciou (o lembrete de
            carrinho, que você pode cancelar a qualquer momento) e, quando
            aplicável, no seu <strong>consentimento</strong> (por exemplo, para
            cookies de análise).
          </p>
        </Section>

        <Section n="5" title="Com quem compartilhamos">
          <p>
            Não vendemos seus dados. Compartilhamos apenas o necessário com
            prestadores de serviço que tornam a loja possível:
          </p>
          <ul>
            <li>
              <strong>Mercado Pago</strong> e <strong>PayPal</strong> — processamento
              de pagamentos.
            </li>
            <li>
              <strong>Correios / Melhor Envio</strong> — cálculo de frete e entrega.
            </li>
            <li>
              <strong>Banco de Dados</strong> — provedor de infraestrutura onde ficam
              sua conta, pedidos e interesses, com acesso restrito e criptografia.
            </li>
            <li>
              <strong>Google</strong> (Sheets e Analytics) — gestão de pedidos e
              análise de acessos.
            </li>
          </ul>
          <p>
            Cada um trata os dados apenas para a finalidade contratada e sob suas
            próprias políticas de privacidade.
          </p>
        </Section>

        <Section n="6" title="Cookies">
          <p>
            Usamos cookies essenciais (para o carrinho e o login funcionarem) e
            cookies de análise (para entender o uso do site). Você pode bloquear
            cookies nas configurações do seu navegador, mas algumas funções podem
            deixar de funcionar corretamente.
          </p>
        </Section>

        <Section n="7" title="Por quanto tempo guardamos">
          <p>
            Mantemos seus dados enquanto sua conta existir e pelo prazo exigido por
            lei (por exemplo, obrigações fiscais). Depois disso, os dados são
            apagados ou anonimizados. O carrinho guardado para o lembrete deixa de
            ser usado depois de 48 horas.
          </p>
        </Section>

        <Section n="8" title="Segurança">
          <p>
            Adotamos medidas técnicas para proteger seus dados: conexão criptografada
            (HTTPS), senhas armazenadas com criptografia e regras de acesso que
            garantem que cada pessoa só acesse os próprios dados. Nenhum sistema é
            100% infalível, mas trabalhamos para reduzir riscos.
          </p>
        </Section>

        <Section n="9" title="Seus direitos (LGPD)">
          <p>A qualquer momento, você pode solicitar:</p>
          <ul>
            <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
            <li>Correção de dados incompletos ou desatualizados.</li>
            <li>Exclusão dos seus dados, quando cabível.</li>
            <li>Portabilidade dos dados.</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Para exercer qualquer direito, escreva para{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              {CONTACT_EMAIL}
            </a>
            . Responderemos no menor prazo possível.
          </p>
        </Section>
      </LegalPage>
    </Layout>
  );
}
