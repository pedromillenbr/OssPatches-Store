-- Pedidos que não apareciam em "Meus pedidos"
-- =============================================================================
-- Até aqui o pedido só era gravado no Banco de Dados pelo NAVEGADOR do cliente,
-- na última tela do checkout, e só se ele estivesse logado. Quem comprou como
-- convidado, ou pagou o Pix no app do banco e fechou a aba, nunca virava linha
-- no banco — o pedido existia na planilha e no gateway, mas a conta ficava
-- vazia. Agora quem grava é o servidor, no momento da compra.
--
-- Como o pedido pode nascer sem dono (compra sem conta), guardamos o e-mail da
-- compra e deixamos o cliente enxergar por ele. Assim, se a pessoa criar a
-- conta depois com o mesmo e-mail, os pedidos antigos aparecem sozinhos.
--
-- Rode este arquivo UMA VEZ no SQL Editor do painel do Banco de Dados.
-- Pode rodar de novo sem medo: tudo aqui é idempotente.

-- 1) E-mail usado na compra, para ligar pedido e conta sem depender do login.
alter table public.orders
  add column if not exists customer_email text;

-- 2) Pedido de convidado não tem dono no momento da compra.
alter table public.orders
  alter column user_id drop not null;

-- 3) Busca por e-mail sem varrer a tabela inteira.
create index if not exists orders_customer_email_idx
  on public.orders (lower(customer_email));

-- 4) O cliente logado enxerga os pedidos feitos com o e-mail da conta dele.
--    Esta política SOMA com a que já existe (por user_id) — no Postgres as
--    políticas permissivas se combinam com OU, então nada do que já funciona
--    deixa de funcionar.
drop policy if exists "orders_select_by_email" on public.orders;
create policy "orders_select_by_email"
  on public.orders
  for select
  to authenticated
  using (
    customer_email is not null
    and lower(customer_email) = lower(auth.jwt() ->> 'email')
  );
