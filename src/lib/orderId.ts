import crypto from 'crypto';

/**
 * Gera um ID de pedido único no formato OSS-AAMMDD-XXXXXX.
 *
 * Usa crypto.randomBytes (aleatoriedade criptográfica) em vez de Math.random.
 * O ID vira a chave de idempotência enviada ao Mercado Pago/PayPal — uma colisão
 * faria o gateway recusar o segundo pagamento silenciosamente, então precisamos
 * de entropia alta e imprevisível.
 */
export function generateOrderId(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  // 4 bytes = 8 chars hex maiúsculos (~4.3 bilhões de combinações)
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `OSS-${yy}${mm}${dd}-${rand}`;
}
