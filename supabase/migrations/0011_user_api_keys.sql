-- Per-user "bring your own key" Anthropic API keys.
--
-- Kept in its own table (rather than a column on profiles) so it never gets
-- swept up by the admin-bypass "view all profiles" policy in
-- 0010_admin_approval.sql - a user's personal API key is theirs alone, the
-- admin has no legitimate reason to read it, so there is no admin policy
-- here at all.
create table if not exists public.user_api_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  anthropic_api_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_api_keys enable row level security;

create policy "Users manage their own API key"
  on public.user_api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_user_api_keys_updated_at on public.user_api_keys;
create trigger set_user_api_keys_updated_at
  before update on public.user_api_keys
  for each row execute function public.set_updated_at();
