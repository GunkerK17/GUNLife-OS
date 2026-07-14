create table if not exists public.timeline_generation_suppression (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  log_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists timeline_generation_suppression_user_date_idx
  on public.timeline_generation_suppression (user_id, log_date);

alter table public.timeline_generation_suppression enable row level security;

drop policy if exists "Users can manage their own timeline_generation_suppression"
  on public.timeline_generation_suppression;

create policy "Users can manage their own timeline_generation_suppression"
  on public.timeline_generation_suppression for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
