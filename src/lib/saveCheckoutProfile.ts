import { supabase } from '@/lib/supabase';
import type { CustomerIdentification, Address } from '@/types';

/**
 * Salva no perfil do usuário logado os dados que ele preenche no checkout,
 * para virem prontos na próxima compra. Silencioso e não-bloqueante: se o
 * cliente for convidado (sem conta) ou der erro, o checkout segue normal.
 */
export async function saveIdentificationToProfile(customer: CustomerIdentification): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        full_name: customer.name,
        phone: customer.phone ?? null,
        cpf: customer.cpf ?? null,
        country_code: customer.countryCode,
      })
      .eq('id', user.id);
  } catch (err) {
    console.error('saveIdentificationToProfile:', err);
  }
}

export async function saveAddressToProfile(address: Address): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ address })
      .eq('id', user.id);
  } catch (err) {
    console.error('saveAddressToProfile:', err);
  }
}
