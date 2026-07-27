-- Eixo Real - estrutura de dados do MVP
-- Execute este arquivo no SQL Editor do Supabase/Lovable Cloud.

create table if not exists public.app_users (
  id text primary key,
  name text not null,
  role text not null check (role in ('motorista', 'mecanico', 'gestor')),
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id text primary key,
  placa text not null unique,
  frota text not null unique,
  marca text not null,
  modelo text not null,
  ano integer not null,
  tipo text not null,
  implemento text,
  hodometro integer not null default 0 check (hodometro >= 0),
  data_entrada date not null,
  status text not null default 'ok'
    check (status in ('ok', 'atencao', 'nao_conforme')),
  motorista_principal_id text references public.app_users(id) on delete set null,
  observacoes text,
  foto_url text,
  ultima_revisao_km integer not null default 0,
  proxima_revisao_km integer not null default 10000,
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_executions (
  id text primary key,
  template_id text not null,
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  hodometro integer not null check (hodometro >= 0),
  answers jsonb not null default '{}'::jsonb,
  status text not null check (status in ('em_andamento', 'finalizado')),
  decision text check (decision in ('ok', 'atencao', 'nao_conforme')),
  assinatura_data_url text,
  created_at timestamptz not null,
  finalized_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_issues (
  id text primary key,
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  execution_id text references public.checklist_executions(id) on delete set null,
  item_label text not null,
  item_status text not null check (item_status in ('ok', 'atencao', 'nao_conforme')),
  descricao text not null default '',
  foto_data_url text,
  created_at timestamptz not null,
  hodometro integer not null check (hodometro >= 0),
  aberto_por text not null,
  prazo timestamptz,
  mecanico_id text references public.app_users(id) on delete set null,
  status text not null check (
    status in ('aberta', 'em_analise', 'aguardando_peca', 'em_manutencao', 'concluida', 'cancelada')
  ),
  diagnostico text,
  pecas text,
  servico_executado text,
  concluido_em timestamptz,
  hodometro_conclusao integer,
  foto_depois_data_url text,
  liberado_por text,
  critica boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists checklist_executions_vehicle_idx
  on public.checklist_executions(vehicle_id, created_at desc);
create index if not exists maintenance_issues_vehicle_idx
  on public.maintenance_issues(vehicle_id, created_at desc);
create index if not exists maintenance_issues_status_idx
  on public.maintenance_issues(status);

-- Usuários iniciais exibidos na tela de acesso. Edite os nomes conforme a equipe real.
insert into public.app_users (id, name, role) values
  ('u-mot-1', 'Carlos Souza', 'motorista'),
  ('u-mot-2', 'João Pereira', 'motorista'),
  ('u-mec-1', 'Rafael Lima', 'mecanico'),
  ('u-ges-1', 'Ana Ribeiro', 'gestor')
on conflict (id) do update set name = excluded.name, role = excluded.role;

-- O MVP mantém a seleção de perfil sem senha. Estas políticas liberam o acesso
-- somente para a chave pública deste projeto. Antes do uso em produção, ative
-- Supabase Auth e substitua estas políticas por regras ligadas a auth.uid().
alter table public.app_users enable row level security;
alter table public.vehicles enable row level security;
alter table public.checklist_executions enable row level security;
alter table public.maintenance_issues enable row level security;

drop policy if exists "mvp_app_users" on public.app_users;
create policy "mvp_app_users" on public.app_users for select using (true);

drop policy if exists "mvp_vehicles" on public.vehicles;
create policy "mvp_vehicles" on public.vehicles for all using (true) with check (true);

drop policy if exists "mvp_checklist_executions" on public.checklist_executions;
create policy "mvp_checklist_executions" on public.checklist_executions
  for all using (true) with check (true);

drop policy if exists "mvp_maintenance_issues" on public.maintenance_issues;
create policy "mvp_maintenance_issues" on public.maintenance_issues
  for all using (true) with check (true);

