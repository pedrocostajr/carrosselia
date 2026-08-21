create table if not exists public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  display_name text not null,
  instagram_handle text not null,
  avatar_url text,
  logo_url text,
  logo_alt_url text,
  color_primary text not null default '#111111',
  color_secondary text not null default '#4B5563',
  color_accent text not null default '#2563EB',
  color_background text not null default '#FFFFFF',
  color_text text not null default '#111111',
  font_heading text not null default 'Playfair Display',
  font_body text not null default 'Inter',
  button_style text not null default 'solid',
  corner_radius integer not null default 16,
  visual_style text not null default 'minimalista',
  footer_text text,
  default_cta text,
  site_or_handle text,
  is_preset boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_kits_user_id_idx on public.brand_kits (user_id);
create index if not exists brand_kits_user_id_updated_at_idx on public.brand_kits (user_id, updated_at desc);

alter table public.brand_kits enable row level security;

create policy "Brand kits are managed by their owner - select"
  on public.brand_kits for select
  using (auth.uid() = user_id);

create policy "Brand kits are managed by their owner - insert"
  on public.brand_kits for insert
  with check (auth.uid() = user_id);

create policy "Brand kits are managed by their owner - update"
  on public.brand_kits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Brand kits are managed by their owner - delete"
  on public.brand_kits for delete
  using (auth.uid() = user_id);

drop trigger if exists set_brand_kits_updated_at on public.brand_kits;
create trigger set_brand_kits_updated_at
  before update on public.brand_kits
  for each row execute function public.set_updated_at();
