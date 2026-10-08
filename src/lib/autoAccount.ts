import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendAccountCreatedEmail } from '@/services/email';
import { CONFIG } from '@/config';

/**
 * Cria a conta de quem comprou sem cadastro, assim que o pagamento entra.
 *
 * A loja aceita compra sem conta para não perder venda — mas sem conta o
 * cliente não tem "Meus pedidos" e os dados dele (CPF, endereço) não ficam
 * guardados para a próxima compra. Aqui a conta nasce sozinha, com o que ele
 * já digitou no checkout, e ele recebe um e-mail para escolher a senha.
 *
 * Só depois do pagamento confirmado: se fosse na criação do pedido, qualquer
 * um geraria contas e e-mails em massa só montando carrinhos.
 *
 * E-mail que JÁ tem conta não é tocado. Quem compra deslogado não provou ser
 * o dono daquele e-mail, então não pode sobrescrever o cadastro de ninguém —
 * o pedido aparece na conta existente pelo e-mail da compra, como sempre.
 *
 * Nunca lança: o cliente já pagou, e nada aqui pode atrapalhar a confirmação.
 */
export async function ensureAccountForOrder(orderRef: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  try {
    const { data: order, error: readError } = await admin
      .from('orders')
      .select('user_id, customer_email, customer_name, customer_phone, customer_cpf, address')
      .eq('order_ref', orderRef)
      .maybeSingle();

    if (readError) {
      console.error(`[autoAccount] ${orderRef}:`, readError.message);
      return;
    }

    const email = String(order?.customer_email || '').trim().toLowerCase();
    if (!order || order.user_id || !email) return;

    const name = String(order.customer_name || '').trim();

    // Sem senha: ninguém entra nesta conta até abrir o link que vai para a
    // caixa de entrada — é isso que prova que o e-mail é mesmo da pessoa.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError || !created?.user) {
      const known =
        createError?.code === 'email_exists' ||
        /already (been )?registered/i.test(createError?.message || '');
      if (!known) console.error(`[autoAccount] ${orderRef}:`, createError?.message);
      return;
    }

    const userId = created.user.id;
    const address = (order.address ?? null) as Record<string, unknown> | null;

    const profile = {
      full_name: name || null,
      phone: order.customer_phone || null,
      cpf: order.customer_cpf || null,
      country_code: String(address?.countryCode || 'BR'),
      address,
    };

    // O perfil é criado por um gatilho do banco no cadastro; só completamos.
    // Se o gatilho não tiver rodado, criamos a linha aqui.
    const { data: updated, error: profileError } = await admin
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select('id');

    if (profileError) {
      console.error(`[autoAccount] ${orderRef} (perfil):`, profileError.message);
    } else if (!updated?.length) {
      const { error } = await admin.from('profiles').insert({ id: userId, ...profile });
      if (error) console.error(`[autoAccount] ${orderRef} (perfil):`, error.message);
    }

    // Amarra à conta todos os pedidos de convidado feitos com este e-mail.
    const { error: linkError } = await admin
      .from('orders')
      .update({ user_id: userId })
      .eq('customer_email', email)
      .is('user_id', null);
    if (linkError) console.error(`[autoAccount] ${orderRef} (pedidos):`, linkError.message);

    // Link de uso único para escolher a senha. Vai pelo nosso domínio, com o
    // código depois do "#": assim ele não aparece em log de servidor.
    const { data: link, error: tokenError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    const token = link?.properties?.hashed_token;
    if (tokenError || !token) {
      console.error(`[autoAccount] ${orderRef} (link):`, tokenError?.message);
    }

    const passwordUrl = token
      ? `${CONFIG.siteUrl}/redefinir-senha#token_hash=${encodeURIComponent(token)}`
      : `${CONFIG.siteUrl}/senha-perdida`;

    await sendAccountCreatedEmail({ email, firstName: name.split(/\s+/)[0], passwordUrl });
    console.log(`[autoAccount] conta criada para o pedido ${orderRef}`);
  } catch (err) {
    console.error(`[autoAccount] ${orderRef} (inesperado):`, err);
  }
}
