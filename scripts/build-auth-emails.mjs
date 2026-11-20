/**
 * Gera os modelos de e-mail do login (Banco de Dados > Authentication > Email
 * Templates) em supabase/email-templates/. Esses e-mails NÃO saem do código:
 * o HTML precisa ser colado no painel. Este script só garante que todos usem o
 * mesmo visual dos e-mails de pedido (src/services/email.ts).
 *
 * Rodar: node scripts/build-auth-emails.mjs
 * As variáveis {{ .ConfirmationURL }} etc. são preenchidas pelo próprio painel.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://osspatches.com';
// Endereço final (osspatches.com redireciona para o www).
const SITE_WWW = 'https://www.osspatches.com';
const WHATSAPP = 'https://wa.me/5521982479922';
const INSTAGRAM = 'https://instagram.com/osspatches';
const RED = '#DC2626';
const FONT = "Helvetica,Arial,sans-serif";

function layout({ preheader, title, body, button, after }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f2f2f2">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2f2">
  <tr><td align="center" style="padding:32px 12px">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#ffffff">
      <tr><td align="center" style="background:#000000;padding:30px 32px 26px">
        <a href="${SITE}" style="text-decoration:none;color:#ffffff;font-family:${FONT};font-size:26px;font-weight:900;letter-spacing:4px">OSSPATCHES</a>
        <p style="margin:6px 0 0;font-family:${FONT};font-size:11px;letter-spacing:2px;color:#9a9a9a">FAIXAS &amp; PATCHES DE JIU-JITSU</p>
      </td></tr>
      <tr><td style="background:${RED};height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>
      <tr><td style="padding:44px 40px 12px;font-family:${FONT}">
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.3;color:#000000;font-weight:800">${title}</h1>
        ${body}
      </td></tr>
      <tr><td align="center" style="padding:20px 40px 8px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" bgcolor="#000000" style="background:#000000">
            <a href="${button.url}" style="display:inline-block;padding:16px 40px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:.5px">${button.label}</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 40px 40px;font-family:${FONT}">
        ${after}
        <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#9a9a9a">
          O botão não funcionou? Copie e cole este endereço no navegador:<br>
          <a href="${button.url}" style="color:#555555;word-break:break-all">${button.url}</a>
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;border-top:1px solid #eeeeee;padding:26px 40px;text-align:center;font-family:${FONT}">
        <p style="margin:0 0 10px;font-size:13px;color:#555555">
          Precisa de ajuda?
          <a href="${WHATSAPP}" style="color:#000000;font-weight:700;text-decoration:none">WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="${INSTAGRAM}" style="color:#000000;font-weight:700;text-decoration:none">Instagram</a>
        </p>
        <p style="margin:0;font-size:11px;color:#aaaaaa">
          <a href="${SITE}" style="color:#aaaaaa;text-decoration:none">osspatches.com</a> · Produção 100% própria
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;
}

const p = (text) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#444444">${text}</p>`;
const note = (text) =>
  `<p style="margin:0;font-size:13px;line-height:1.6;color:#777777">${text}</p>`;

const templates = {
  'recuperar-senha': {
    subject: 'Redefina sua senha — OssPatches',
    preheader: 'Use o botão para criar uma senha nova. O link vale por tempo limitado.',
    title: 'Vamos criar uma senha nova',
    body:
      p('Recebemos um pedido para redefinir a senha da conta <strong>{{ .Email }}</strong>.') +
      p('Clique no botão abaixo e escolha a nova senha. Leva menos de um minuto.'),
    // Link direto para a nossa página, com o código depois do "#". O link
    // padrão ({{ .ConfirmationURL }}) passava pelo Banco de Dados, era gasto por
    // qualquer pré-visualização e caía na home em vez da tela de nova senha.
    button: {
      label: 'Redefinir minha senha',
      url: `${SITE_WWW}/redefinir-senha#token_hash={{ .TokenHash }}&type=recovery`,
    },
    after: note('O link funciona uma vez e expira em pouco tempo. Se não foi você que pediu, ignore este e-mail: sua senha atual continua valendo.'),
  },
  'confirmar-cadastro': {
    subject: 'Confirme seu e-mail — OssPatches',
    preheader: 'Falta um clique para ativar sua conta na OssPatches.',
    title: 'Bem-vindo à OssPatches',
    body:
      p('Sua conta foi criada com o e-mail <strong>{{ .Email }}</strong>.') +
      p('Confirme o endereço para acompanhar seus pedidos e comprar mais rápido da próxima vez.'),
    button: { label: 'Confirmar meu e-mail', url: '{{ .ConfirmationURL }}' },
    after: note('Se você não criou uma conta na OssPatches, pode ignorar este e-mail.'),
  },
  'link-de-acesso': {
    subject: 'Seu link de acesso — OssPatches',
    preheader: 'Entre na sua conta com um clique, sem senha.',
    title: 'Seu link para entrar',
    body: p('Use o botão abaixo para entrar na sua conta <strong>{{ .Email }}</strong> sem digitar senha.'),
    button: { label: 'Entrar na minha conta', url: '{{ .ConfirmationURL }}' },
    after: note('O link funciona uma vez e expira em pouco tempo. Se não foi você, ignore este e-mail.'),
  },
  'trocar-email': {
    subject: 'Confirme a troca de e-mail — OssPatches',
    preheader: 'Confirme o novo endereço da sua conta.',
    title: 'Confirme seu novo e-mail',
    body: p('Recebemos um pedido para trocar o e-mail da sua conta de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>.'),
    button: { label: 'Confirmar troca', url: '{{ .ConfirmationURL }}' },
    after: note('Se você não pediu essa troca, não clique no botão e fale com a gente pelo WhatsApp.'),
  },
  convite: {
    subject: 'Você foi convidado — OssPatches',
    preheader: 'Aceite o convite e crie sua senha.',
    title: 'Você foi convidado',
    body: p('Você recebeu um convite para criar uma conta na OssPatches com o e-mail <strong>{{ .Email }}</strong>.'),
    button: { label: 'Aceitar convite', url: '{{ .ConfirmationURL }}' },
    after: note('Se você não esperava este convite, pode ignorar este e-mail.'),
  },
};

const dir = join(process.cwd(), 'supabase', 'email-templates');
mkdirSync(dir, { recursive: true });
const subjects = [];
for (const [name, t] of Object.entries(templates)) {
  writeFileSync(join(dir, `${name}.html`), layout(t));
  subjects.push(`${name}.html  ->  Assunto: ${t.subject}`);
}
writeFileSync(join(dir, 'ASSUNTOS.txt'), subjects.join('\n') + '\n');
console.log(subjects.join('\n'));
