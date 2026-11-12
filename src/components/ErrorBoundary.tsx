import { Component, type ErrorInfo, type ReactNode } from 'react';
import { COMPANY } from '@/config/company';

/**
 * Rede de proteção do site inteiro.
 *
 * Sem ela, qualquer erro de JavaScript no navegador derruba a página toda e o
 * cliente vê "Application error: a client-side exception has occurred" — sem
 * saída e sem nada para nós investigarmos. Aqui o erro vira uma tela com botão
 * de recarregar e WhatsApp, e é enviado para os logs (/api/client-error).
 *
 * Erro de "pedaço do site não carregou" (internet instável, ou site atualizado
 * com a aba aberta) se resolve recarregando, então recarregamos sozinhos —
 * uma vez só por sessão, para nunca entrar em loop.
 */

const RELOAD_FLAG = 'oss-error-reloaded';

function isChunkError(error: Error): boolean {
  return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module|Importing a module script failed/i.test(
    `${error.name} ${error.message}`
  );
}

export function reportClientError(error: unknown, extra?: string) {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    const body = JSON.stringify({
      message: err.message.slice(0, 500),
      name: err.name,
      stack: (err.stack || '').slice(0, 2000),
      extra: (extra || '').slice(0, 1500),
      path: window.location.pathname,
      ua: navigator.userAgent,
    });
    const url = '/api/client-error';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* registrar o erro nunca pode gerar outro erro */
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, info.componentStack || '');

    if (isChunkError(error)) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
        }
      } catch {
        /* sessionStorage bloqueado: fica na tela de erro, que tem o botão */
      }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const whatsapp = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(
      'Olá! O site da OssPatches deu erro aqui para mim.'
    )}`;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background: '#0A0A0A',
          color: '#FFFFFF',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: '#C9A227', margin: 0 }}>
            OssPatches
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '12px 0 8px' }}>Algo deu errado por aqui</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: '#A3A3A3', margin: '0 0 28px' }}>
            Recarregue a página para continuar. Seu carrinho continua salvo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#FFFFFF',
              color: '#0A0A0A',
              border: 0,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', marginTop: 16, fontSize: 14, color: '#A3A3A3', textDecoration: 'underline' }}
          >
            Continua com problema? Fale com a gente no WhatsApp
          </a>
        </div>
      </div>
    );
  }
}
