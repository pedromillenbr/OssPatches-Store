import { Resend } from 'resend';
import { Order } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
// After verifying osspatches.com in Resend dashboard, change to: pedidos@osspatches.com
const FROM = process.env.RESEND_FROM_EMAIL || 'OssPatches <onboarding@resend.dev>';

function formatPrice(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

/**
 * Escapa texto vindo do cliente antes de entrar no HTML do e-mail. Sem isso,
 * alguém podia colocar links/HTML no nome ou endereço e usar nosso remetente
 * oficial para mandar phishing a qualquer e-mail.
 */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function itemsTable(order: Order): string {
  return order.items
    .map((item) => {
      const c = item.customization as unknown as Record<string, unknown>;
      const detail = [
        c.size ? `Tam: ${esc(c.size)}` : '',
        'degree' in c ? `Grau: ${esc(c.degree)}` : '',
        c.embroideredName ? `Nome: ${esc(c.embroideredName)}` : '',
        c.format ? `Formato: ${esc(c.format)}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#333">
            ${esc(item.name)}${detail ? `<br><span style="color:#888;font-size:12px">${detail}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right">
            ${formatPrice(item.price, order.currency)}
          </td>
        </tr>`;
    })
    .join('');
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%">
        <!-- Header -->
        <tr>
          <td style="background:#000;padding:24px 40px">
            <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:2px">OSSPATCHES</p>
            <p style="margin:4px 0 0;color:#aaa;font-size:12px;letter-spacing:1px">FAIXAS & PATCHES PREMIUM</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eee;text-align:center">
            <p style="margin:0;font-size:12px;color:#999">Dúvidas? Fale conosco pelo WhatsApp ou Instagram</p>
            <p style="margin:8px 0 0;font-size:12px;color:#999">© ${new Date().getFullYear()} OssPatches — Todos os direitos reservados</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const isBrazil = order.currency === 'BRL';
  const shippingName = esc(order.shipping?.name || (isBrazil ? 'A calcular' : 'Internacional'));
  const shippingDays = esc(order.shipping?.days || '');

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#000">Pedido recebido!</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px">
      Olá, <strong>${esc(order.customer.name.split(' ')[0])}</strong>! Recebemos seu pedido e já estamos preparando tudo com carinho.
    </p>

    <div style="background:#f9f9f9;border-left:4px solid #000;padding:16px 20px;margin-bottom:28px">
      <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px">Número do pedido</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#000;font-family:monospace">${order.id}</p>
    </div>

    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:0 0 12px;border-bottom:1px solid #eee;padding-bottom:8px">Itens do pedido</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsTable(order)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#555">Subtotal</td>
        <td style="padding:6px 0;font-size:14px;color:#555;text-align:right">${formatPrice(order.subtotal, order.currency)}</td>
      </tr>
      ${order.discountAmount ? `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#16a34a">Cupom ${esc(order.couponCode)} (${esc(order.discountPercent)}%)</td>
        <td style="padding:6px 0;font-size:14px;color:#16a34a;text-align:right">-${formatPrice(order.discountAmount, order.currency)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#555">Frete (${shippingName}${shippingDays ? ` · ${shippingDays}` : ''})</td>
        <td style="padding:6px 0;font-size:14px;color:#555;text-align:right">${formatPrice(order.shippingCost, order.currency)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#000;border-top:2px solid #000">Total</td>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#000;text-align:right;border-top:2px solid #000">${formatPrice(order.total, order.currency)}</td>
      </tr>
    </table>

    <div style="margin-top:28px;padding:20px;background:#f9f9f9;border:1px solid #eee">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#000">Entrega</p>
      <p style="margin:0;font-size:14px;color:#555;line-height:1.6">
        ${esc(order.address.street)}${order.address.number ? `, ${esc(order.address.number)}` : ''}${order.address.complement ? ` — ${esc(order.address.complement)}` : ''}<br>
        ${esc(order.address.city)}${order.address.state ? `, ${esc(order.address.state)}` : ''} — ${esc(order.address.country)}<br>
        CEP: ${esc(order.address.zipCode)}
      </p>
    </div>

    <div style="margin-top:28px;padding:16px 20px;background:#fffbeb;border:1px solid #fde68a;border-radius:4px">
      <p style="margin:0;font-size:14px;color:#92400e">
        ${order.payment.method === 'pix'
          ? 'Aguardando confirmação do Pix. Assim que identificarmos o pagamento, você receberá um novo e-mail.'
          : 'Seu pedido está confirmado. Entraremos em contato assim que for enviado.'}
      </p>
    </div>`;

  await resend.emails.send({
    from: FROM,
    to: order.customer.email,
    subject: `Pedido ${order.id.replace(/[^\w-]/g, '')} recebido — OssPatches`,
    html: baseLayout(content),
  });
}

export async function sendPaymentConfirmedEmail(order: Order): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#16a34a">Pagamento confirmado!</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px">
      Seu Pix foi recebido com sucesso. Agora é com a gente — já estamos preparando seu pedido.
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;margin-bottom:28px">
      <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px">Número do pedido</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#000;font-family:monospace">${order.id}</p>
    </div>

    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:0 0 12px;border-bottom:1px solid #eee;padding-bottom:8px">Itens do pedido</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsTable(order)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
      <tr>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#000;border-top:2px solid #000">Total pago</td>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#16a34a;text-align:right;border-top:2px solid #000">${formatPrice(order.total, order.currency)}</td>
      </tr>
    </table>

    <div style="margin-top:28px;padding:20px;background:#f9f9f9;border:1px solid #eee">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#000">Próximos passos</p>
      <p style="margin:0;font-size:14px;color:#555;line-height:1.8">
        1. Seu pedido entra em produção<br>
        2. Prazo de envio: até 3 dias úteis<br>
        3. Você receberá o código de rastreio por e-mail
      </p>
    </div>`;

  await resend.emails.send({
    from: FROM,
    to: order.customer.email,
    subject: `Pagamento confirmado — Pedido ${order.id}`,
    html: baseLayout(content),
  });
}
