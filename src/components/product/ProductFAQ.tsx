import { useState } from 'react';
import clsx from 'clsx';

interface FAQItem {
  question: string;
  answer: string;
}

const BELT_FAQ: FAQItem[] = [
  {
    question: 'Por que comprar com a OssPatches?',
    answer:
      'Somos produção própria — cada faixa é fabricada por nós, sem intermediários. Isso garante controle total da qualidade, material selecionado e padrão IBJJF em cada peça. Atendemos atletas amadores e profissionais no Brasil e no exterior, com envio para todo o mundo.',
  },
  {
    question: 'Qual o material das faixas?',
    answer:
      'Nossas faixas são feitas em algodão canelado de alta densidade, o mesmo padrão utilizado por atletas profissionais em campeonatos mundiais.',
  },
  {
    question: 'Como lavar a faixa?',
    answer:
      'Lave à mão ou na máquina em ciclo delicado, com água fria (máximo 30°C). Não use alvejante. Seque à sombra — o sol direto pode clarear a cor ao longo do tempo. Não torça a faixa, deixe escorrer naturalmente.',
  },
  {
    question: 'Qual o prazo de produção?',
    answer:
      'O prazo máximo de produção é de 7 dias úteis após a confirmação do pagamento, incluindo faixas personalizadas com bordado. O prazo de entrega varia conforme o frete escolhido e o CEP de destino.',
  },
  {
    question: 'A faixa é padrão IBJJF?',
    answer:
      'Sim. Todas as nossas faixas seguem as especificações oficiais da IBJJF: largura de 4,5 cm, ponta preta para adultos e comprimentos padronizados por tamanho. Aceitas em todos os campeonatos filiados.',
  },
];

const PATCH_FAQ: FAQItem[] = [
  {
    question: 'Como funciona o processo de personalização?',
    answer:
      'Você envia o arquivo de arte (PNG ou PDF em alta resolução) no campo indicado. Nossa equipe analisa e entra em contato se houver algum ajuste necessário. Você escolhe o tamanho variável 12-22cm A produção começa após o pagamento.',
  },
  {
    question: 'Qual a quantidade mínima de patches?',
    answer:
      'O pedido mínimo é de 5 unidades.',
  },
  {
    question: 'Qual o prazo de produção dos patches?',
    answer:
      'Após aprovação do, o prazo de produção é de até 7 dias úteis. O frete é calculado automaticamente pelo CEP e aparece no checkout.',
  },
  {
    question: 'Os patches são bordados ou impressos?',
    answer:
      'Trabalhamos exclusivamente com sublimado. Não fazemos patches impressos ou bordados — o sublimado garante durabilidade superior e qualidade premium em cada peça.',
  },
  {
    question: 'Os patches seguem o padrão IBJJF?',
    answer:
      'Sim. Os tamanhos P (até 12cm), M (até 15cm) e G (até 22cm) foram desenvolvidos respeitando as regras de uniformes IBJJF para kimono e no-gi.',
  },
];

interface ProductFAQProps {
  isPatch?: boolean;
}

export default function ProductFAQ({ isPatch = false }: ProductFAQProps) {
  const [open, setOpen] = useState<number | null>(0);
  const items = isPatch ? PATCH_FAQ : BELT_FAQ;

  return (
    <section className="py-12 sm:py-16 border-t border-brand-gray-200">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-brand-gray-400 mb-3">
          Dúvidas Frequentes
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-brand-black">
          Perguntas frequentes
        </h3>
      </div>

      <div className="divide-y divide-brand-gray-200 border-t border-brand-gray-200">
        {items.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between py-4 text-left gap-4 group"
            >
              <span
                className={clsx(
                  'font-semibold text-sm sm:text-base transition-colors',
                  open === i ? 'text-brand-black' : 'text-brand-gray-700 group-hover:text-brand-black'
                )}
              >
                {item.question}
              </span>
              <span
                className={clsx(
                  'shrink-0 w-6 h-6 flex items-center justify-center border rounded-full text-sm transition-all duration-200',
                  open === i
                    ? 'bg-brand-black text-white border-brand-black rotate-45'
                    : 'border-brand-gray-300 text-brand-gray-500 group-hover:border-brand-black'
                )}
              >
                +
              </span>
            </button>
            <div
              className={clsx(
                'overflow-hidden transition-all duration-300',
                open === i ? 'max-h-96 pb-4' : 'max-h-0'
              )}
            >
              <p className="text-sm text-brand-gray-600 leading-relaxed pr-10">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
