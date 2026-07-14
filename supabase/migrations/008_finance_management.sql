alter table public.wallets
  add column if not exists provider text,
  add column if not exists account_last4 text,
  add column if not exists credit_limit numeric(14, 2),
  add column if not exists statement_day int,
  add column if not exists due_day int,
  add column if not exists goal_id uuid references public.goals (id) on delete set null,
  add column if not exists note text;

alter table public.wallets
  drop constraint if exists wallets_credit_limit_check,
  add constraint wallets_credit_limit_check
    check (credit_limit is null or credit_limit >= 0),
  drop constraint if exists wallets_statement_day_check,
  add constraint wallets_statement_day_check
    check (statement_day is null or statement_day between 1 and 28),
  drop constraint if exists wallets_due_day_check,
  add constraint wallets_due_day_check
    check (due_day is null or due_day between 1 and 28);

alter table public.transactions
  add column if not exists destination_wallet_id uuid
    references public.wallets (id) on delete restrict,
  add column if not exists goal_id uuid
    references public.goals (id) on delete set null,
  add column if not exists merchant text,
  add column if not exists transfer_group_id uuid;

create index if not exists wallets_user_goal_idx
  on public.wallets (user_id, goal_id);

create index if not exists transactions_destination_wallet_idx
  on public.transactions (user_id, destination_wallet_id);

create index if not exists transactions_goal_idx
  on public.transactions (user_id, goal_id);

create index if not exists transactions_transfer_group_idx
  on public.transactions (user_id, transfer_group_id);
