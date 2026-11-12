-- ---------------------------------------------------------------------------
-- Funil de vendas
--
-- Uma linha por visitante, por etapa, por dia: "o visitante X chegou à etapa Y
-- no dia Z". É o que o painel (/admin/funil) usa para mostrar quantas pessoas
-- chegaram a cada etapa e onde desistiram.
--
-- PRIVACIDADE: visitor_id é um código aleatório gerado no navegador. Não há
-- nome, e-mail, IP nem nada que identifique a pessoa. Só quem deixa o e-mail no
-- checkout aparece com nome — e isso já está em abandoned_carts.
--
-- SEGURANÇA: RLS ligado e nenhuma policy, como em abandoned_carts. Só o
-- servidor (chave de serviço) lê e escreve.
-- ---------------------------------------------------------------------------

create table if not exists public.checkout_events (
  id          bigint generated always as identity primary key,
  visitor_id  text        not null,
  step        text        not null
              check (step in ('produto', 'carrinho', 'checkout', 'dados', 'endereco', 'frete', 'pagamento')),
  -- Dia no horário de Brasília. A unique abaixo faz cada visitante contar uma
  -- vez por etapa por dia, por mais que recarregue a página.
  day         date        not null default ((now() at time zone 'America/Sao_Paulo')::date),
  created_at  timestamptz not null default now(),
  unique (visitor_id, step, day)
);

alter table public.checkout_events enable row level security;

create index if not exists checkout_events_day_idx on public.checkout_events (day);

-- Liga o carrinho abandonado ao visitante, para o painel saber em qual etapa
-- a pessoa parou.
alter table public.abandoned_carts add column if not exists visitor_id text;
