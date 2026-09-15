import { CONFIG } from '@/config';
import type { CartItem } from '@/types';

/**
 * Cálculo e validação de frete no servidor.
 *
 * MOTIVO DE EXISTIR: o navegador do cliente escolhe uma opção de frete e manda
 * o preço (`shippingCost`) junto com o pedido. Nunca podemos confiar nesse valor
 * — um cliente mal-intencionado poderia mandar `shippingCost: 0` e nós pagaríamos
 * o envio do próprio bolso. Aqui recalculamos o frete no servidor (chamando o
 * Melhor Envio com nossa própria credencial) e validamos o valor que o cliente
 * enviou contra as opções reais.
 */

// Dimensões físicas de cada tipo de produto (para o Melhor Envio calcular).
// O cliente NÃO envia isso — derivamos do catálogo no servidor.
function dimensionsFor(item: CartItem) {
  const isPatch = item.category === 'patch';
  const d = isPatch ? CONFIG.patchDimensions : CONFIG.beltDimensions;
  return {
    weight: d.weight,
    width: d.width,
    height: d.height,
    length: d.length,
    quantity: Math.min(100, Math.max(1, Number(item.quantity) || 1)),
  };
}

interface MelhorEnvioService {
  id: number;
  price: string | null;
  error?: string;
}

const ALLOWED_SERVICES = [31, 33, 34];

/**
 * Retorna a lista de preços de frete reais (em BRL) para o CEP e itens dados,
 * calculados pelo Melhor Envio no servidor. Retorna null se o serviço não
 * puder ser consultado (sem token, erro de rede, etc.) — o chamador decide
 * o que fazer nesse caso.
 */
export async function getServerShippingPrices(
  destinationCep: string,
  items: CartItem[]
): Promise<number[] | null> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return null;

  const cep = String(destinationCep || '').replace(/\D/g, '');
  if (cep.length !== 8) return null;

  const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';
  const baseUrl = isSandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';

  const payload = {
    from: { postal_code: CONFIG.originCEP.replace(/\D/g, '') },
    to: { postal_code: cep },
    products: items.map(dimensionsFor),
    options: { receipt: false, own_hand: false },
    services: ALLOWED_SERVICES.join(','),
  };

  try {
    const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'OssPatches/1.0 (contato@osspatches.com)',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[shipping] Melhor Envio retornou', response.status);
      return null;
    }

    const data: MelhorEnvioService[] = await response.json();
    const prices = data
      .filter((s) => !s.error && s.price !== null && ALLOWED_SERVICES.includes(s.id))
      .map((s) => parseFloat(s.price as string))
      .filter((p) => Number.isFinite(p) && p > 0);

    return prices.length > 0 ? prices : null;
  } catch (err) {
    console.error('[shipping] Erro ao calcular frete no servidor:', err);
    return null;
  }
}

export interface ShippingValidationResult {
  /** Valor de frete a ser cobrado (o seguro, decidido pelo servidor). */
  shippingCost: number;
  /** true se o valor do cliente foi aceito; false se o servidor teve de corrigir. */
  trusted: boolean;
}

/**
 * Valida o frete que o cliente enviou contra os preços reais do servidor.
 *
 * Regra: o cliente pode ter escolhido qualquer uma das opções reais, então
 * aceitamos o valor dele se ele for >= à opção MAIS BARATA (com tolerância de
 * centavos). Se ele mandou menos que a opção mais barata (tentativa de fraude),
 * ou se não conseguimos calcular, caímos para o valor real mais barato.
 *
 * Se o Melhor Envio estiver indisponível, mantemos o valor do cliente para não
 * derrubar a venda — mas nunca aceitamos frete negativo.
 */
export async function validateShippingCost(
  destinationCep: string,
  items: CartItem[],
  clientShippingCost: unknown
): Promise<ShippingValidationResult> {
  const clientValue = Number(clientShippingCost);
  const safeClientValue = Number.isFinite(clientValue) && clientValue >= 0 ? clientValue : 0;

  const prices = await getServerShippingPrices(destinationCep, items);

  // Serviço indisponível: não temos como validar. Mantemos o valor do cliente
  // (já garantido não-negativo) para não bloquear a compra.
  if (!prices || prices.length === 0) {
    console.warn('[shipping] Não foi possível validar o frete — usando valor do cliente com fallback seguro');
    return { shippingCost: safeClientValue, trusted: false };
  }

  const cheapest = Math.min(...prices);
  const tolerance = 0.05; // 5 centavos de folga para arredondamento

  // Cliente mandou um valor plausível (>= opção mais barata): aceitamos.
  if (safeClientValue >= cheapest - tolerance) {
    return { shippingCost: safeClientValue, trusted: true };
  }

  // Cliente tentou pagar menos que o frete real → forçamos o valor real.
  console.warn(
    `[shipping] Frete do cliente (${safeClientValue}) abaixo do real (${cheapest}) — corrigido pelo servidor`
  );
  return { shippingCost: cheapest, trusted: false };
}
