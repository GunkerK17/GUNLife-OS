create extension if not exists pgcrypto;

create type public.timeline_category as enum (
  'sleep',
  'gym',
  'work',
  'study',
  'sport',
  'meal',
  'rest',
  'other'
);

create type public.task_status as enum ('pending', 'done', 'skipped');
create type public.activity_type as enum (
  'football',
  'running',
  'walking',
  'cycling',
  'tabata',
  'swimming',
  'other'
);
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.goal_category as enum (
  'health',
  'learning',
  'finance',
  'career',
  'personal',
  'other'
);
create type public.goal_status as enum (
  'active',
  'completed',
  'paused',
  'abandoned'
);
create type public.skill_level as enum (
  'beginner',
  'intermediate',
  'advanced'
);
create type public.mood as enum ('great', 'good', 'okay', 'bad', 'terrible');
create type public.wallet_type as enum (
  'cash',
  'bank',
  'credit',
  'e-wallet',
  'investment'
);
create type public.transaction_type as enum (
  'income',
  'expense',
  'transfer'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.timeline_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  category public.timeline_category not null default 'other',
  start_time time not null,
  duration_min int not null check (duration_min > 0),
  repeat_days text not null,
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.timeline_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  template_id uuid references public.timeline_templates (id) on delete set null,
  log_date date not null,
  title text not null,
  category public.timeline_category not null default 'other',
  start_time time,
  duration_min int check (duration_min is null or duration_min > 0),
  status public.task_status not null default 'pending',
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  day_of_week text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  exercise_name text not null,
  muscle_group text,
  sets int check (sets is null or sets >= 0),
  reps int check (reps is null or reps >= 0),
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg >= 0),
  rest_sec int check (rest_sec is null or rest_sec >= 0),
  order_index int not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid references public.workout_plans (id) on delete set null,
  log_date date not null,
  calories_burned int check (calories_burned is null or calories_burned >= 0),
  avg_heart_rate int check (avg_heart_rate is null or avg_heart_rate >= 0),
  max_heart_rate int check (max_heart_rate is null or max_heart_rate >= 0),
  duration_min int check (duration_min is null or duration_min >= 0),
  note text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  log_date date not null,
  type public.activity_type not null default 'other',
  duration_min int check (duration_min is null or duration_min >= 0),
  calories_burned int check (calories_burned is null or calories_burned >= 0),
  avg_heart_rate int check (avg_heart_rate is null or avg_heart_rate >= 0),
  max_heart_rate int check (max_heart_rate is null or max_heart_rate >= 0),
  distance_km numeric(8, 2) check (distance_km is null or distance_km >= 0),
  note text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  log_date date not null,
  meal_type public.meal_type not null,
  food_name text not null,
  calories numeric(8, 2) check (calories is null or calories >= 0),
  protein_g numeric(8, 2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(8, 2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(8, 2) check (fat_g is null or fat_g >= 0),
  quantity numeric(10, 2) check (quantity is null or quantity >= 0),
  unit text,
  note text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  log_date date not null,
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  body_fat_pct numeric(5, 2) check (body_fat_pct is null or body_fat_pct >= 0),
  muscle_kg numeric(6, 2) check (muscle_kg is null or muscle_kg >= 0),
  visceral_fat int check (visceral_fat is null or visceral_fat >= 0),
  note text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  measured_at date not null,
  chest_cm numeric(6, 2),
  waist_cm numeric(6, 2),
  hip_cm numeric(6, 2),
  arm_cm numeric(6, 2),
  thigh_cm numeric(6, 2),
  calf_cm numeric(6, 2),
  note text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  category public.goal_category not null default 'other',
  target_days int check (target_days is null or target_days > 0),
  start_date date not null,
  end_date date,
  status public.goal_status not null default 'active',
  target_value numeric(12, 2),
  current_value numeric(12, 2),
  unit text,
  color text,
  icon text,
  created_at timestamptz not null default now()
);

create table public.goal_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  task_date date not null,
  description text not null,
  status public.task_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  unique (goal_id, task_date)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  category text,
  description text,
  level public.skill_level not null default 'beginner',
  started_at date not null default current_date,
  target_days int check (target_days is null or target_days > 0),
  color text,
  created_at timestamptz not null default now()
);

create table public.skill_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  task_date date not null,
  description text not null,
  duration_min int check (duration_min is null or duration_min >= 0),
  status public.task_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  unique (skill_id, task_date)
);

create table public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  log_date date not null,
  content text,
  mood public.mood,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  type public.wallet_type not null default 'cash',
  balance numeric(14, 2) not null default 0,
  currency text not null default 'VND',
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  tx_date date not null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount >= 0),
  category text not null,
  note text,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category text not null,
  budget_amount numeric(14, 2) not null check (budget_amount >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year >= 2000),
  created_at timestamptz not null default now(),
  unique (user_id, category, month, year)
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  bio text,
  date_of_birth date,
  height_cm numeric(6, 2),
  target_weight_kg numeric(6, 2),
  job_title text,
  company text,
  education text,
  skills_list jsonb,
  assets jsonb,
  certificates jsonb,
  notes text,
  daily_calorie_goal int not null default 2200,
  daily_protein_goal int not null default 150,
  daily_carbs_goal int not null default 250,
  daily_fat_goal int not null default 65,
  created_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index timeline_templates_user_active_idx
  on public.timeline_templates (user_id, is_active);
create index timeline_logs_user_date_idx
  on public.timeline_logs (user_id, log_date);
create index workout_plans_user_active_idx
  on public.workout_plans (user_id, is_active);
create index workout_exercises_user_plan_idx
  on public.workout_exercises (user_id, plan_id);
create index workout_logs_user_date_idx
  on public.workout_logs (user_id, log_date);
create index activities_user_date_idx
  on public.activities (user_id, log_date);
create index nutrition_logs_user_date_idx
  on public.nutrition_logs (user_id, log_date);
create index weight_logs_user_date_idx
  on public.weight_logs (user_id, log_date);
create index body_measurements_user_date_idx
  on public.body_measurements (user_id, measured_at);
create index goals_user_status_idx
  on public.goals (user_id, status);
create index goal_daily_tasks_user_date_idx
  on public.goal_daily_tasks (user_id, task_date);
create index skills_user_started_idx
  on public.skills (user_id, started_at);
create index skill_daily_tasks_user_date_idx
  on public.skill_daily_tasks (user_id, task_date);
create index journals_user_date_idx
  on public.journals (user_id, log_date);
create index wallets_user_active_idx
  on public.wallets (user_id, is_active);
create index transactions_user_date_idx
  on public.transactions (user_id, tx_date);
create index monthly_budgets_user_month_idx
  on public.monthly_budgets (user_id, year, month);
create index ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);

alter table public.users enable row level security;
alter table public.timeline_templates enable row level security;
alter table public.timeline_logs enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.activities enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.goals enable row level security;
alter table public.goal_daily_tasks enable row level security;
alter table public.skills enable row level security;
alter table public.skill_daily_tasks enable row level security;
alter table public.journals enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.user_profiles enable row level security;
alter table public.ai_conversations enable row level security;

create policy "Users can manage their own user row"
  on public.users for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can manage their own timeline_templates"
  on public.timeline_templates for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own timeline_logs"
  on public.timeline_logs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own workout_plans"
  on public.workout_plans for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own workout_exercises"
  on public.workout_exercises for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own workout_logs"
  on public.workout_logs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own activities"
  on public.activities for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own nutrition_logs"
  on public.nutrition_logs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own weight_logs"
  on public.weight_logs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own body_measurements"
  on public.body_measurements for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own goals"
  on public.goals for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own goal_daily_tasks"
  on public.goal_daily_tasks for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own skills"
  on public.skills for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own skill_daily_tasks"
  on public.skill_daily_tasks for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own journals"
  on public.journals for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own wallets"
  on public.wallets for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own transactions"
  on public.transactions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own monthly_budgets"
  on public.monthly_budgets for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own user_profiles"
  on public.user_profiles for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own ai_conversations"
  on public.ai_conversations for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_journals_updated_at
  before update on public.journals
  for each row execute function public.set_updated_at();

create trigger set_ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;

  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
