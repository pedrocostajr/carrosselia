create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  carousel_id uuid references public.carousels (id) on delete set null,
  format text not null check (format in ('1080x1350', '1080x1080')),
  quality text not null default 'high' check (quality in ('standard', 'high', 'maximum')),
  file_count integer not null default 0,
  pdf_included boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists exports_project_id_idx on public.exports (project_id);
create index if not exists exports_user_id_idx on public.exports (user_id);

alter table public.exports enable row level security;

create policy "Exports are managed by their owner - select"
  on public.exports for select
  using (auth.uid() = user_id);

create policy "Exports are managed by their owner - insert"
  on public.exports for insert
  with check (auth.uid() = user_id);

create policy "Exports are managed by their owner - delete"
  on public.exports for delete
  using (auth.uid() = user_id);
