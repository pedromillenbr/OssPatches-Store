/**
 * Dados de identificação da empresa.
 *
 * O Decreto 7.962/2013 (regulamenta o CDC para o comércio eletrônico) exige que
 * nome empresarial, CNPJ e endereço físico e eletrônico fiquem em local de
 * destaque no site. Centralizamos aqui para que o rodapé e as páginas legais
 * mostrem sempre a mesma informação.
 *
 * TODO (pedido do dono, 26/09/2026): razão social, CNPJ e endereço estão
 * ocultos por enquanto — campo vazio simplesmente não é renderizado. Preencher
 * antes de anunciar a loja, para ficar em dia com o decreto. O endereço físico
 * da operação é o mesmo `originCEP` de src/config/index.ts.
 */
export const COMPANY = {
  /** Nome fantasia, usado nos textos. */
  tradeName: 'OssPatches',

  /** Razão social registrada. Vazio = não aparece. */
  legalName: '',

  /** Somente números ou já formatado — exibido como está. Vazio = não aparece. */
  cnpj: '',

  /** Endereço físico. Rua vazia = o endereço inteiro não aparece. */
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
  },

  /** Endereço eletrônico de atendimento. */
  email: 'osspatches@gmail.com',

  /** WhatsApp de atendimento (só dígitos, com DDI). */
  whatsapp: '5521982479922',

  /** Comarca do foro nos Termos de Uso. */
  jurisdiction: 'Rio de Janeiro/RJ',
} as const;

/** Endereço numa linha só, para o rodapé. String vazia quando não preenchido. */
export function companyAddressLine(): string {
  const { street, city, state, zipCode } = COMPANY.address;
  if (!street) return '';
  const place = [city, state].filter(Boolean).join('/');
  return [street, place, zipCode && `CEP ${zipCode}`].filter(Boolean).join(' — ');
}

/** WhatsApp formatado para leitura: +55 (21) 98247-9922 */
export function companyWhatsAppDisplay(): string {
  const d = COMPANY.whatsapp;
  if (d.length !== 13) return d;
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
}
