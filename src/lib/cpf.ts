/** Strips all non-digit characters from a CPF string. */
export function cpfDigitsOnly(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/** Formats a raw digit string as "000.000.000-00". */
export function formatCPF(value: string): string {
  const digits = cpfDigitsOnly(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validates a CPF using the official Receita Federal algorithm.
 * Rejects known invalid sequences (all same digit) and wrong check digits.
 */
export function isValidCPF(cpf: string): boolean {
  const digits = cpfDigitsOnly(cpf);

  if (digits.length !== 11) return false;

  // Reject sequences like 000.000.000-00, 111.111.111-11, etc.
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}
