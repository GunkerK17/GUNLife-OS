alter table public.ai_conversations
  add column if not exists category text not null default 'general',
  add column if not exists is_pinned boolean not null default false;

alter table public.ai_conversations
  drop constraint if exists ai_conversations_category_check;

alter table public.ai_conversations
  add constraint ai_conversations_category_check
  check (category in ('general', 'daily', 'health', 'goals', 'finance', 'learning'));

create index if not exists ai_conversations_user_category_idx
  on public.ai_conversations (user_id, category, is_pinned desc, updated_at desc);
