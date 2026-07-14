alter table public.timeline_logs
  add column if not exists source_type text,
  add column if not exists source_id uuid;

create index if not exists timeline_logs_source_idx
  on public.timeline_logs (user_id, source_type, source_id);
