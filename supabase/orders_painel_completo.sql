-- Painel de pedidos completo
-- =============================================================================
-- O painel só guardava itens, valor e endereço. Faltava o essencial para
-- despachar sem abrir a planilha: quem comprou, como falar com a pessoa, como
-- ela pagou e qual frete escolheu. E não havia como saber quais pedidos você
-- já tinha visto.
--
-- Rode este arquivo UMA VEZ no SQL Editor do painel do Banco de Dados.
-- Pode rodar de novo sem medo: tudo aqui é idempotente.

-- 1) Quem comprou e como falar com a pessoa.
alter table public.orders add column if not exists customer_name  text;
alter table public.orders add column if not exists customer_phone text;

-- 2) Como pagou e qual frete escolheu — o que decide a postagem.
alter table public.orders add column if not exists payment_method  text;
alter table public.orders add column if not exists shipping_method text;

-- 3) Quando você abriu o pedido pela primeira vez. Vazio = pedido novo,
--    que aparece marcado em vermelho na lista.
alter table public.orders add column if not exists seen_at timestamptz;
