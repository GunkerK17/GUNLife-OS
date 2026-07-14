insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lifeos-activities',
  'lifeos-activities',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view activity images" on storage.objects;
drop policy if exists "Users can upload activity images" on storage.objects;
drop policy if exists "Users can update activity images" on storage.objects;
drop policy if exists "Users can delete activity images" on storage.objects;

create policy "Users can view activity images"
  on storage.objects for select to authenticated
  using (bucket_id = 'lifeos-activities' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload activity images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lifeos-activities' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update activity images"
  on storage.objects for update to authenticated
  using (bucket_id = 'lifeos-activities' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'lifeos-activities' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete activity images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lifeos-activities' and (storage.foldername(name))[1] = auth.uid()::text);
