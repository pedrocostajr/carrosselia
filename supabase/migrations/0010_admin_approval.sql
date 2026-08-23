-- Admin role and signup-approval gate.
--
-- pedroadair96@gmail.com is the fixed general admin of the system (set
-- directly in the trigger below, not read from a table, so it can never be
-- escalated by editing application data). Every other new signup starts as
-- role='user' / approval_status='pending' and must be approved by an admin
-- before they can use the dashboard/editor - enforced in application code
-- (src/lib/admin) since Postgres RLS alone can't easily gate whole pages.
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

alter table public.profiles
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected'));

-- Promote/approve the fixed admin account if it already signed up before
-- this migration ran.
update public.profiles
set role = 'admin', approval_status = 'approved'
where email = 'pedroadair96@gmail.com';

-- Re-create the signup trigger so new users get the right defaults,
-- auto-approving only the fixed admin email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, approval_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.email = 'pedroadair96@gmail.com' then 'admin' else 'user' end,
    case when new.email = 'pedroadair96@gmail.com' then 'approved' else 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The admin can see and moderate every profile, in addition to each user
-- still seeing their own row via the existing owner policy.
create policy "Admin can view all profiles"
  on public.profiles for select
  using (auth.jwt() ->> 'email' = 'pedroadair96@gmail.com');

create policy "Admin can update all profiles"
  on public.profiles for update
  using (auth.jwt() ->> 'email' = 'pedroadair96@gmail.com')
  with check (auth.jwt() ->> 'email' = 'pedroadair96@gmail.com');

-- Lets the admin panel show a per-user project count as a basic activity
-- signal, without needing the service-role key for a simple read.
create policy "Admin can view all projects"
  on public.projects for select
  using (auth.jwt() ->> 'email' = 'pedroadair96@gmail.com');
