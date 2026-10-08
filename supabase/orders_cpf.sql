-- CPF no painel de pedidos
-- =============================================================================
-- O CPF era pedido no checkout e enviado ao gateway de pagamento, mas não
-- ficava guardado no pedido. Sem ele não dá para emitir nota nem preencher a
-- etiqueta sem perguntar de novo ao cliente.
--
-- Rode este arquivo UMA VEZ no SQL Editor do painel do Banco de Dados.
-- Pode rodar de novo sem medo: é idempotente.

alter table public.orders add column if not exists customer_cpf text;
