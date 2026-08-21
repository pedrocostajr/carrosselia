create table if not exists public.carousels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  brand_kit_id uuid references public.brand_kits (id) on delete set null,
  title text not null default 'Carrossel sem título',
  framework text,
  format text not null default '1080x1350' check (format in ('1080x1350', '1080x1080')),
  strategy jsonb not null default '{}'::jsonb,
  caption jsonb,
  editorial_score jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carousels_project_id_idx on public.carousels (project_id);
create index if not exists carousels_user_id_idx on public.carousels (user_id);

alter table public.carousels enable row level security;

create policy "Carousels are managed by their owner - select"
  on public.carousels for select
  using (auth.uid() = user_id);

create policy "Carousels are managed by their owner - insert"
  on public.carousels for insert
  with check (auth.uid() = user_id);

create policy "Carousels are managed by their owner - update"
  on public.carousels for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Carousels are managed by their owner - delete"
  on public.carousels for delete
  using (auth.uid() = user_id);

drop trigger if exists set_carousels_updated_at on public.carousels;
create trigger set_carousels_updated_at
  before update on public.carousels
  for each row execute function public.set_updated_at();

-- Slides: one row per slide, ordered via order_index. The full visual state
-- (elements, positions, styles, layers, font metadata, image references,
-- lock/visibility flags) lives in slide_data as structured JSON validated by
-- the app's Zod schema before every write; order_index and type/template are
-- duplicated as plain columns purely to make sorting and filtering cheap.
create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  carousel_id uuid not null references public.carousels (id) on delete cascade,
  order_index integer not null,
  type text not null,
  template text not null default 'minimal',
  format text not null default '1080x1350' check (format in ('1080x1350', '1080x1080')),
  slide_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slides_carousel_order_unique unique (carousel_id, order_index) deferrable initially deferred
);

create index if not exists slides_carousel_id_idx on public.slides (carousel_id, order_index);
create index if not exists slides_user_id_idx on public.slides (user_id);

alter table public.slides enable row level security;

create policy "Slides are managed by their owner - select"
  on public.slides for select
  using (auth.uid() = user_id);

create policy "Slides are managed by their owner - insert"
  on public.slides for insert
  with check (auth.uid() = user_id);

create policy "Slides are managed by their owner - update"
  on public.slides for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Slides are managed by their owner - delete"
  on public.slides for delete
  using (auth.uid() = user_id);

drop trigger if exists set_slides_updated_at on public.slides;
create trigger set_slides_updated_at
  before update on public.slides
  for each row execute function public.set_updated_at();
