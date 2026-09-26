/**
 * Dados de identificação da empresa.
 *
 * O Decreto 7.962/2013 (regulamenta o CDC para o comércio eletrônico) exige que
 * nome empresarial, CNPJ e endereço físico e eletrônico fiquem em local de
 * destaque no site. Centralizamos aqui para que o rodapé e as páginas legais
 * mostrem sempre a mesma informação.
 *
 * Campos vazios simplesmente não são exibidos — melhor omitir do que publicar
 * um dado errado. PREENCHER `legalName` e `cnpj` antes de divulgar a loja.
 */
export const COMPANY = {
  /** Nome fantasia, usado nos textos. */
  tradeName: 'OssPatches',

  /** Razão social registrada. Deixe vazio até confirmar. */
  legalName: '',

  /** Somente números ou já formatado — exibido como está. Vazio = não aparece. */
  cnpj: '',

  /** Endereço físico. */
  address: {
    street: 'Avenida das Américas, 17300',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22790-701',
    country: 'Brasil',
  },

  /** Endereço eletrônico de atendimento. */
  email: 'osspatches@gmail.com',

  /** WhatsApp de atendimento (só dígitos, com DDI). */
  whatsapp: '5521982479922',

  /** Comarca do foro nos Termos de Uso. */
  jurisdiction: 'Rio de Janeiro/RJ',
} as const;

/** Endereço numa linha só, para o rodapé. */
export function companyAddressLine(): string {
  const { street, city, state, zipCode } = COMPANY.address;
  return `${street} — ${city}/${state} — CEP ${zipCode}`;
}

/** WhatsApp formatado para leitura: +55 (21) 98247-9922 */
export function companyWhatsAppDisplay(): string {
  const d = COMPANY.whatsapp;
  if (d.length !== 13) return d;
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
}
