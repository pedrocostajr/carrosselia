create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_kit_id uuid references public.brand_kits (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  kind text not null check (kind in ('logo', 'logo_alt', 'avatar', 'upload', 'export')),
  storage_path text not null,
  width integer,
  height integer,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create index if not exists assets_user_id_idx on public.assets (user_id);
create index if not exists assets_brand_kit_id_idx on public.assets (brand_kit_id);
create index if not exists assets_project_id_idx on public.assets (project_id);

alter table public.assets enable row level security;

create policy "Assets are managed by their owner - select"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Assets are managed by their owner - insert"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "Assets are managed by their owner - update"
  on public.assets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Assets are managed by their owner - delete"
  on public.assets for delete
  using (auth.uid() = user_id);
