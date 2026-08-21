-- Storage layout: every object path starts with the owner's user id
-- (e.g. "{user_id}/brand/{brand_kit_id}/logo.png"), which the policies below
-- use to guarantee a user can only write inside their own folder.
--
-- "brand-assets" is public-read: logos, avatars and slide images must load
-- into the Konva canvas (both editor and PNG export) without signed-URL
-- expiry or CORS friction, and this content is meant for public Instagram
-- publication anyway. Only the owner may write/delete inside their folder.
--
-- "exports" is private: finished export archives are only ever served to
-- their owner via short-lived signed URLs generated server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exports',
  'exports',
  false,
  52428800, -- 50MB
  array['image/png', 'application/zip', 'application/pdf']
)
on conflict (id) do nothing;

create policy "brand-assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

create policy "brand-assets are writable by their owner"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "brand-assets are updatable by their owner"
  on storage.objects for update
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "brand-assets are deletable by their owner"
  on storage.objects for delete
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "exports are readable by their owner"
  on storage.objects for select
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "exports are writable by their owner"
  on storage.objects for insert
  with check (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "exports are deletable by their owner"
  on storage.objects for delete
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
