/**
 * Arte dos patches personalizados, guardada no bucket privado `artworks`.
 *
 * O caminho tem formato fixo ("2026-10/<uuid>.png"): é ele que viaja no
 * carrinho e no pedido, então o servidor só aceita o que bate com este
 * padrão — ninguém aponta o pedido para outro arquivo do Banco de Dados.
 */
export const ARTWORK_BUCKET = 'artworks';
export const ARTWORK_MAX_BYTES = 20 * 1024 * 1024;

const PATH_RE = /^\d{4}-\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png)$/;

export function isArtworkPath(value: unknown): value is string {
  return typeof value === 'string' && PATH_RE.test(value);
}

/** Endereço do painel que abre a arte (pede login de admin). */
export function artworkAdminUrl(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/$/, '')}/admin/arte?path=${encodeURIComponent(path)}`;
}
