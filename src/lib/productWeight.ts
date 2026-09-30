import { CONFIG } from '@/config';
import type { CartItem } from '@/types';

/**
 * Peso e medidas de cada item, para a cotação de frete.
 *
 * POR QUE EXISTE: faixa não tem peso único. Uma M1 pesa 200 g e uma A5 pesa
 * 370 g — quase o dobro. Cobrando peso fixo, ou a loja perde dinheiro nas
 * faixas grandes, ou espanta o cliente das pequenas. Aqui o peso sai do
 * tamanho que a pessoa escolheu.
 *
 * O tamanho é lido do pedido no SERVIDOR. O navegador nunca manda peso: se
 * mandasse, dava para pedir frete de 10 g e mandar a loja pagar a diferença.
 */

/** Tamanhos do menor para o maior — é esta ordem que define o peso. */
export const BELT_SIZE_ORDER = [
  'M0', 'M1', 'M2', 'M3', 'M4', 'M5',
  'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
] as const;

/** Medidos na loja: M1 = 200 g, A5 = 370 g. */
const REFERENCE = { size: 'M1', kg: 0.2 } as const;
const REFERENCE_TOP = { size: 'A5', kg: 0.37 } as const;

/** Quanto cada degrau de tamanho acrescenta (17 g por tamanho). */
const STEP_KG =
  (REFERENCE_TOP.kg - REFERENCE.kg) /
  (BELT_SIZE_ORDER.indexOf(REFERENCE_TOP.size) - BELT_SIZE_ORDER.indexOf(REFERENCE.size));

/**
 * Peso de UMA faixa, em kg, pelo tamanho.
 *
 * Tamanho desconhecido cai no mais pesado de propósito: errar para cima custa
 * centavos no frete; errar para baixo significa a loja pagando a diferença na
 * postagem de todo pedido daquele tipo.
 */
export function beltWeightKg(size: unknown): number {
  const index = BELT_SIZE_ORDER.indexOf(
    String(size ?? '').trim().toUpperCase() as (typeof BELT_SIZE_ORDER)[number]
  );
  if (index === -1) return beltWeightKg('A7');

  const base = BELT_SIZE_ORDER.indexOf(REFERENCE.size);
  const kg = REFERENCE.kg + (index - base) * STEP_KG;
  return Math.round(kg * 1000) / 1000;
}

/**
 * Item do carrinho no formato que o Melhor Envio espera (kg e cm).
 *
 * Patch tem peso próprio e muito menor — não faz sentido cobrar caixa de
 * faixa para um bordado de 5 cm.
 */
export function parcelFor(item: CartItem) {
  const isPatch = !String(item.category).startsWith('belt');
  const box = isPatch ? CONFIG.patchDimensions : CONFIG.beltDimensions;
  const customization = (item.customization ?? {}) as unknown as Record<string, unknown>;

  return {
    weight: isPatch ? box.weight : beltWeightKg(customization.size),
    width: box.width,
    height: box.height,
    length: box.length,
    quantity: Math.min(100, Math.max(1, Number(item.quantity) || 1)),
  };
}
