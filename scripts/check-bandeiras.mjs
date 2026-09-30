/**
 * Mostra quais bandeiras de cartão a conta do Mercado Pago aceita hoje.
 *
 * Serve para acompanhar pedidos de habilitação (ex.: débito Visa/Mastercard,
 * que dependem de liberação do time de risco do Mercado Pago e não de código).
 *
 * Uso:  node scripts/check-bandeiras.mjs
 */
import { readFile } from 'fs/promises';

const ENV_FILE = '.env.local';
const ENV_KEY = 'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY';

// Bandeiras que faltam na conta e que valem um pedido ao Mercado Pago.
// Nada disso depende de código: o site já usa a bandeira que o Mercado Pago
// informar, então no dia em que forem liberadas passam a funcionar sozinhas.
//   debvisa / debmaster → débito Visa e Mastercard, os mais usados do país
//   hipercard           → forte no Nordeste e em redes de varejo
const AGUARDANDO = ['debvisa', 'debmaster', 'hipercard'];

const LABELS = {
  credit_card: 'Crédito',
  debit_card: 'Débito',
  prepaid_card: 'Pré-pago',
};

async function publicKey() {
  const env = await readFile(ENV_FILE, 'utf8');
  const line = env.split('\n').find((l) => l.startsWith(`${ENV_KEY}=`));
  if (!line) throw new Error(`${ENV_KEY} não encontrada em ${ENV_FILE}`);
  return line.slice(ENV_KEY.length + 1).trim().replace(/^"|"$/g, '');
}

const res = await fetch(
  `https://api.mercadopago.com/v1/payment_methods?public_key=${await publicKey()}`
);
if (!res.ok) {
  console.error(`Mercado Pago respondeu ${res.status}. Tente de novo em instantes.`);
  process.exit(1);
}

const methods = await res.json();
const cards = methods.filter((m) => LABELS[m.payment_type_id]);

console.log(`\nConsultado em ${new Date().toLocaleString('pt-BR')}\n`);
for (const [type, label] of Object.entries(LABELS)) {
  const ids = cards.filter((m) => m.payment_type_id === type).map((m) => m.id);
  console.log(`${label.padEnd(9)} ${ids.length ? ids.join(', ') : '(nenhuma)'}`);
}

const liberadas = AGUARDANDO.filter((id) => cards.some((m) => m.id === id));
const pendentes = AGUARDANDO.filter((id) => !liberadas.includes(id));

console.log('');
if (liberadas.length) console.log(`✅ LIBERADO: ${liberadas.join(', ')} — já funciona no site, sem precisar publicar nada.`);
if (pendentes.length) console.log(`⏳ Ainda aguardando: ${pendentes.join(', ')}`);
console.log('');
