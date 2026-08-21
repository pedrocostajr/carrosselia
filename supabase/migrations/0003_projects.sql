create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_kit_id uuid references public.brand_kits (id) on delete set null,
  title text not null default 'Novo carrossel',
  format text not null default '1080x1350' check (format in ('1080x1350', '1080x1080')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'exported')),
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_user_id_updated_at_idx on public.projects (user_id, updated_at desc);
create index if not exists projects_user_id_status_idx on public.projects (user_id, status);

alter table public.projects enable row level security;

create policy "Projects are managed by their owner - select"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Projects are managed by their owner - insert"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Projects are managed by their owner - update"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Projects are managed by their owner - delete"
  on public.projects for delete
  using (auth.uid() = user_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
