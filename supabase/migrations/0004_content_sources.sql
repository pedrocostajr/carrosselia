create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  type text not null check (type in ('url', 'text', 'topic')),
  url text,
  title text,
  description text,
  author text,
  image_url text,
  site_name text,
  raw_text text,
  edited_text text,
  summary text,
  central_thesis text,
  patterns jsonb not null default '[]'::jsonb,
  imported_at timestamptz not null default now()
);

create index if not exists content_sources_project_id_idx on public.content_sources (project_id);
create index if not exists content_sources_user_id_idx on public.content_sources (user_id);

alter table public.content_sources enable row level security;

create policy "Content sources are managed by their owner - select"
  on public.content_sources for select
  using (auth.uid() = user_id);

create policy "Content sources are managed by their owner - insert"
  on public.content_sources for insert
  with check (auth.uid() = user_id);

create policy "Content sources are managed by their owner - update"
  on public.content_sources for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Content sources are managed by their owner - delete"
  on public.content_sources for delete
  using (auth.uid() = user_id);
