import { useCartStore } from '@/store/cartStore';
import type { CustomerIdentification } from '@/types';

/**
 * Manda o carrinho atual para o servidor guardar, junto do e-mail informado no
 * primeiro passo do checkout. É o que permite o lembrete caso a pessoa não
 * finalize.
 *
 * Silencioso e sem await de propósito: ninguém pode esperar por isto para
 * avançar no checkout, e uma falha aqui não pode aparecer para o cliente.
 */
export function saveCartForRecovery(customer: CustomerIdentification): void {
  try {
    const items = useCartStore.getState().items;
    if (items.length === 0) return;

    void fetch('/api/cart/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer.email,
        name: customer.name,
        items,
        currency: customer.countryCode === 'BR' ? 'BRL' : 'USD',
      }),
      // A pessoa pode fechar a aba logo em seguida; keepalive faz a requisição
      // sobreviver a isso.
      keepalive: true,
    }).catch(() => {
      /* bastidor — o checkout não pode parar por causa disto */
    });
  } catch {
    /* idem */
  }
}
