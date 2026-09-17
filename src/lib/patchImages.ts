/**
 * Escolha da foto de vitrine dos patches.
 *
 * Ordem das fotos em products.json:
 * 0 círculo · 1 triângulo · 2 retângulo · 3 hexágono · 4 quadrado
 *
 * Os quatro produtos de patch compartilham a mesma lista de fotos. Se todos
 * abrirem pela primeira, a loja inteira mostra o mesmo círculo e passa a
 * impressão de que só fazemos um modelo — então cada um lidera com um formato.
 */
const PATCH_CARD_IMAGE: Record<string, number> = {
  'patch-pequeno': 0, // círculo
  'patch-medio': 3, // hexágono
  'patch-grande': 2, // retângulo
  'kit-de-patches': 1, // triângulo (o card do kit usa o mosaico abaixo)
};

/** Fotos do mosaico 2x2 do Kit: triângulo, quadrado, círculo, hexágono. */
export const KIT_MOSAIC = [1, 4, 0, 3];

export function getPatchCardImage(slug: string, images: string[]): string | undefined {
  if (images.length === 0) return undefined;
  return images[PATCH_CARD_IMAGE[slug] ?? 0] ?? images[0];
}
