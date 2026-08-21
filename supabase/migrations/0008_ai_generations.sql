-- Records of AI usage. input_summary intentionally stores only short,
-- non-sensitive metadata (kind, character counts) - never the raw prompt or
-- full source text - so this table is safe to inspect without leaking user
-- content or secrets, per the app's logging policy.
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  kind text not null check (
    kind in ('structure_preview', 'generation', 'slide_improvement', 'split_slide', 'score')
  ),
  provider text not null,
  model text,
  input_summary jsonb not null default '{}'::jsonb,
  succeeded boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_id_idx on public.ai_generations (user_id, created_at desc);
create index if not exists ai_generations_project_id_idx on public.ai_generations (project_id);

alter table public.ai_generations enable row level security;

create policy "AI generations are managed by their owner - select"
  on public.ai_generations for select
  using (auth.uid() = user_id);

create policy "AI generations are managed by their owner - insert"
  on public.ai_generations for insert
  with check (auth.uid() = user_id);
