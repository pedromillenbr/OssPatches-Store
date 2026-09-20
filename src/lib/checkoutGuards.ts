import type { Address, CustomerIdentification, ShippingOption } from '@/types';
import { isValidCPF } from '@/lib/cpf';
import { isValidEmail } from '@/lib/email';

/**
 * Regras de checkout aplicadas no SERVIDOR. Tudo o que chega do navegador pode
 * ter sido adulterado, então aqui reconstruímos cliente/endereço só com campos
 * conhecidos, texto limitado, e validamos país/CEP/e-mail/CPF.
 */

type GuardResult<T> = { ok: true; value: T } | { ok: false; error: string };

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // remove caracteres de controle (quebras de linha, tabs etc.) e limita tamanho
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

export function cleanCustomer(raw: unknown): GuardResult<CustomerIdentification> {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const email = text(c.email, 254).toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: 'E-mail inválido' };

  const name = text(c.name, 100);
  if (name.length < 2) return { ok: false, error: 'Nome inválido' };

  const countryCode = text(c.countryCode, 3).toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(countryCode)) return { ok: false, error: 'País inválido' };

  const cpf = text(c.cpf, 14);
  if (countryCode === 'BR') {
    if (!cpf || !isValidCPF(cpf)) return { ok: false, error: 'CPF inválido' };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      countryCode,
      country: text(c.country, 60),
      ...(countryCode === 'BR' ? { cpf } : {}),
      ...(text(c.phone, 25) ? { phone: text(c.phone, 25) } : {}),
    },
  };
}

export function cleanAddress(raw: unknown, countryCode: string): GuardResult<Address> {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const zipRaw = text(a.zipCode, 12);

  let zipCode = zipRaw;
  if (countryCode === 'BR') {
    const digits = zipRaw.replace(/\D/g, '');
    // CEP inválido impediria revalidar o frete no servidor — recusamos.
    if (digits.length !== 8) return { ok: false, error: 'CEP inválido' };
    zipCode = `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else if (!zipRaw) {
    return { ok: false, error: 'Código postal obrigatório' };
  }

  const street = text(a.street, 120);
  const city = text(a.city, 80);
  if (!street || !city) return { ok: false, error: 'Endereço incompleto' };

  return {
    ok: true,
    value: {
      street,
      number: text(a.number, 20),
      complement: text(a.complement, 80) || undefined,
      neighborhood: text(a.neighborhood, 80) || undefined,
      city,
      state: text(a.state, 40) || undefined,
      country: text(a.country, 60),
      countryCode,
      zipCode,
    },
  };
}

/** Opção de frete apenas para exibição (nome/prazo); o preço vem do servidor. */
export function cleanShippingLabel(raw: unknown, price: number): ShippingOption | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  return {
    id: text(s.id, 40),
    name: text(s.name, 60),
    company: text(s.company, 60),
    days: text(s.days, 60),
    price,
  };
}

/** Formato dos IDs gerados por generateOrderId (OSS-AAMMDD-XXXXXXXX). */
export const ORDER_ID_REGEX = /^OSS-\d{6}-[0-9A-F]{8}$/;
