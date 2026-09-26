-- ---------------------------------------------------------------------------
-- Carrinhos abandonados
--
-- Guarda o carrinho de quem chegou a informar o e-mail no checkout mas não
-- finalizou. Um lembrete por carrinho, disparado pelo cron.
--
-- SEGURANÇA: a tabela tem RLS ligado e NENHUMA policy. Isso é intencional —
-- sem policy, `anon` e `authenticated` não leem nem escrevem nada. Só a chave
-- de serviço (que ignora RLS, usada apenas no servidor) mexe aqui. São dados
-- de gente que não é necessariamente cliente logado, então não existe "dono"
-- da linha para o RLS amarrar.
-- ---------------------------------------------------------------------------

create table if not exists public.abandoned_carts (
  id            uuid primary key default gen_random_uuid(),

  -- Identidade de quem abandonou. O e-mail é a chave: um carrinho aberto por
  -- pessoa, para não mandar dois lembretes a quem tentou comprar duas vezes.
  email         text        not null unique,
  name          text,

  -- Itens no formato do CartItem do site, para o link do e-mail devolver o
  -- carrinho montado mesmo em outro aparelho.
  items         jsonb       not null,
  subtotal      numeric(10,2) not null default 0,
  currency      text        not null default 'BRL',

  -- Token do link do e-mail (restaurar carrinho e descadastrar).
  token         text        not null unique,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Momento em que o lembrete saiu. Nulo = ainda não enviamos.
  emailed_at    timestamptz,
  -- Momento em que a pessoa comprou. Nulo = carrinho ainda aberto.
  recovered_at  timestamptz,
  -- Pediu para não receber. Nunca mais recebe lembrete.
  unsubscribed  boolean     not null default false
);

alter table public.abandoned_carts enable row level security;

-- Índice do sweep do cron: pega só carrinho aberto e ainda não avisado.
create index if not exists abandoned_carts_pending_idx
  on public.abandoned_carts (created_at)
  where emailed_at is null and recovered_at is null and unsubscribed = false;

create index if not exists abandoned_carts_token_idx
  on public.abandoned_carts (token);

-- updated_at sempre em dia, sem depender do código lembrar de setar.
create or replace function public.touch_abandoned_cart()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists abandoned_carts_touch on public.abandoned_carts;
create trigger abandoned_carts_touch
  before update on public.abandoned_carts
  for each row execute function public.touch_abandoned_cart();
