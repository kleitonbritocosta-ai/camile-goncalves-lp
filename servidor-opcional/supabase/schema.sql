-- Cole este arquivo inteiro no SQL Editor do Supabase e rode uma vez.

create table if not exists public.cliques (
  id               bigint generated always as identity primary key,
  codigo           text not null unique,          -- aparece na mensagem do WhatsApp, ex.: 4F7K
  sessao           text unique,                   -- evita duas linhas por duplo clique
  criado_em        timestamptz not null default now(),
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_content      text,
  utm_term         text,
  fbclid           text,
  aparelho         text,
  user_agent       text,
  evento_enviado   boolean not null default false, -- a Meta confirmou o Lead pelo servidor
  chamou_whatsapp  boolean not null default false, -- você marca depois
  status           text,                           -- chamei, agendou, compareceu, fechou
  observacao       text
);

create table if not exists public.visitas (
  id           bigint generated always as identity primary key,
  criado_em    timestamptz not null default now(),
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  utm_term     text,
  aparelho     text
);

-- Ninguém lê nem grava pelo navegador. Só as funções do servidor (chave de serviço).
alter table public.cliques enable row level security;
alter table public.visitas enable row level security;

-- Apagar registros com mais de 90 dias (rode uma vez; ativa a limpeza diária).
-- Requer a extensão pg_cron (Database > Extensions > pg_cron).
-- select cron.schedule('limpar-90-dias', '0 3 * * *', $$
--   delete from public.cliques where criado_em < now() - interval '90 days';
--   delete from public.visitas where criado_em < now() - interval '90 days';
-- $$);
