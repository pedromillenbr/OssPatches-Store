/** Phone helpers for the Brazilian WhatsApp field at checkout. */

/** Strips everything but digits. */
export function phoneDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formats a Brazilian mobile number as "(11) 91234-5678" while the user types.
 * Accepts up to 11 digits (2 DDD + 9 number).
 */
export function formatPhoneBR(value: string): string {
  const d = phoneDigitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** A valid BR mobile has 10 (landline) or 11 (mobile) digits. */
export function isValidPhoneBR(value: string): boolean {
  const d = phoneDigitsOnly(value);
  return d.length === 10 || d.length === 11;
}
