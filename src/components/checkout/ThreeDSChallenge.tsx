import { useEffect, useRef } from 'react';

interface ThreeDSChallengeProps {
  /** URL do banco emissor (three_ds_info.external_resource_url). */
  externalResourceUrl: string;
  /** Identificador do desafio (three_ds_info.creq). */
  creq: string;
  /** O banco avisou que o desafio terminou — ainda não diz se aprovou. */
  onComplete: () => void;
  /** Passaram os ~5 minutos que o banco dá para o cliente responder. */
  onTimeout: () => void;
}

/** O banco cancela o desafio depois de ~5 minutos sem resposta. */
const CHALLENGE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Janela de autenticação 3DS 2.0 — o "Verified by Visa" / "Mastercard Identity
 * Check". Quando o Mercado Pago devolve `pending_challenge`, o cliente precisa
 * confirmar a compra dentro de um iframe servido pelo próprio banco.
 *
 * O formulário é montado dentro do iframe (about:blank, mesma origem) e
 * enviado por POST, como manda a documentação do Mercado Pago.
 */
export default function ThreeDSChallenge({
  externalResourceUrl,
  creq,
  onComplete,
  onTimeout,
}: ThreeDSChallengeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // StrictMode roda o efeito duas vezes em desenvolvimento; enviar o
  // formulário duas vezes invalidaria o desafio.
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    const doc = iframeRef.current?.contentWindow?.document;
    if (!doc) return;
    submitted.current = true;

    const form = doc.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', externalResourceUrl);

    const hidden = doc.createElement('input');
    hidden.setAttribute('type', 'hidden');
    hidden.setAttribute('name', 'creq');
    hidden.setAttribute('value', creq);

    form.appendChild(hidden);
    doc.body.appendChild(form);
    form.submit();
  }, [externalResourceUrl, creq]);

  // Guardamos os callbacks em refs para que o efeito abaixo rode UMA vez: se
  // ele dependesse das funções, cada re-render reiniciaria a contagem dos 5
  // minutos e o desafio nunca expiraria.
  const onCompleteRef = useRef(onComplete);
  const onTimeoutRef = useRef(onTimeout);
  onCompleteRef.current = onComplete;
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    // O banco avisa pelo postMessage que a tela dele terminou. Não checamos a
    // origem porque cada emissor usa um domínio próprio — e não faz mal: este
    // aviso só dispara a consulta do status real na API do Mercado Pago, que é
    // quem decide se o pagamento foi aprovado.
    let done = false;
    const onMessage = (event: MessageEvent) => {
      if (done || event.data?.status !== 'COMPLETE') return;
      done = true;
      onCompleteRef.current();
    };
    window.addEventListener('message', onMessage);

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      onTimeoutRef.current();
    }, CHALLENGE_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[520px] bg-white shadow-xl">
        <div className="border-b border-brand-gray-200 px-5 py-3">
          <p className="font-semibold text-sm text-brand-black">Confirmação do seu banco</p>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Seu banco pediu para confirmar esta compra. Não feche esta janela.
          </p>
        </div>
        <iframe
          ref={iframeRef}
          title="Autenticação do banco"
          className="w-full h-[440px] md:h-[600px] border-0"
        />
      </div>
    </div>
  );
}
