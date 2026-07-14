insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lifeos-workout',
  'lifeos-workout',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can view workout images"
  on storage.objects for select to authenticated
  using (bucket_id = 'lifeos-workout' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload workout images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lifeos-workout' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update workout images"
  on storage.objects for update to authenticated
  using (bucket_id = 'lifeos-workout' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'lifeos-workout' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete workout images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lifeos-workout' and (storage.foldername(name))[1] = auth.uid()::text);
