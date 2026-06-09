/**
 * Email validation utilities for checkout.
 *
 * The goal isn't RFC-perfect parsing — it's catching the real-world mistakes
 * that break order confirmation and payment-gateway calls: malformed
 * addresses and common domain typos (gmial.com, hotmal.com, …).
 */

// Pragmatic email pattern: local@domain.tld with a sane TLD length.
// Avoids the catastrophic-backtracking traps of "full RFC" regexes.
const EMAIL_RE =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}$/i;

// Common domain typos → the address the user almost certainly meant.
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'icloud.con': 'icloud.com',
  'bol.com': 'bol.com.br',
};

export interface EmailCheck {
  valid: boolean;
  /** A friendly error to show when invalid. */
  error?: string;
  /** When set, a "did you mean …?" suggestion for a likely typo. */
  suggestion?: string;
}

/** Normalizes an email for storage/transmission (trim + lowercase). */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/** Fast boolean check — use in API handlers and quick guards. */
export function isValidEmail(email: string): boolean {
  const value = normalizeEmail(email);
  if (!value || value.length > 254) return false;
  if (value.includes('..')) return false; // consecutive dots are invalid
  return EMAIL_RE.test(value);
}

/**
 * Full check for the checkout form — returns a friendly error and, when it
 * detects a likely typo in the domain, a suggested correction.
 */
export function checkEmail(email: string): EmailCheck {
  const value = normalizeEmail(email);

  if (!value) return { valid: false, error: 'E-mail obrigatório' };
  if (value.length > 254) return { valid: false, error: 'E-mail muito longo' };
  if (!isValidEmail(value)) {
    return { valid: false, error: 'E-mail inválido. Verifique e tente novamente.' };
  }

  const domain = value.split('@')[1];
  if (domain && DOMAIN_TYPOS[domain]) {
    const suggested = value.replace(domain, DOMAIN_TYPOS[domain]);
    return { valid: true, suggestion: suggested };
  }

  return { valid: true };
}
