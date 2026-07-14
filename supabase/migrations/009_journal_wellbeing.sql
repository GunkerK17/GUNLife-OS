alter table public.journals
  add column if not exists wellbeing jsonb not null default '{}'::jsonb;

comment on column public.journals.wellbeing is
  'Self-reported daily wellbeing and distraction-control metrics. Not medical data or a diagnosis.';
