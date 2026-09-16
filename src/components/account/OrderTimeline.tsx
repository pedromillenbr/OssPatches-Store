import { ORDER_TIMELINE, timelineIndex } from '@/lib/orderStatus';

/**
 * Linha do tempo do pedido: Pago → Em produção → Enviado → Entregue.
 * Destaca as etapas já concluídas com a cor da marca.
 */
export default function OrderTimeline({ status }: { status: string }) {
  const current = timelineIndex(status);

  if (status === 'pending') {
    return (
      <p className="text-sm text-brand-gray-500">
        Assim que o pagamento for confirmado, o acompanhamento aparece aqui.
      </p>
    );
  }

  return (
    <ol className="flex items-center">
      {ORDER_TIMELINE.map((step, i) => {
        const done = i <= current;
        const isLast = i === ORDER_TIMELINE.length - 1;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done ? 'bg-brand-black text-white' : 'bg-brand-gray-200 text-brand-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={`mt-1.5 text-[11px] font-medium ${
                  done ? 'text-brand-black' : 'text-brand-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mx-1 mb-4 h-0.5 flex-1 ${
                  i < current ? 'bg-brand-black' : 'bg-brand-gray-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
