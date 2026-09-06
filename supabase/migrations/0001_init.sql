-- Sprechen (German learning app) - initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push` once the CLI is linked.

-- 1. Profiles ---------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  current_level text not null default 'a1' check (current_level in ('a1', 'a2', 'b1')),
  xp integer not null default 0,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_active_date date,
  daily_goal_minutes integer not null default 30,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Learner'));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Content: topics ---------------------------------------------------------
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check (level in ('a1', 'a2', 'b1')),
  sort_order integer not null default 0,
  icon text
);

alter table topics enable row level security;
create policy "topics_read_all" on topics for select using (true);

-- 3. Content: vocab items -----------------------------------------------------
create table if not exists vocab_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete set null,
  lemma text not null,
  pos text,
  translation_en text not null,
  example_de text,
  example_en text,
  level text not null check (level in ('a1', 'a2', 'b1')),
  source_ref text
);

alter table vocab_items enable row level security;
create policy "vocab_items_read_all" on vocab_items for select using (true);
create index if not exists vocab_items_topic_idx on vocab_items(topic_id);

-- 4. Content: phrases / dialogue lines for speaking & listening -------------
create table if not exists phrases (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete set null,
  de_text text not null,
  en_text text not null,
  level text not null check (level in ('a1', 'a2', 'b1')),
  situation text,
  source_ref text
);

alter table phrases enable row level security;
create policy "phrases_read_all" on phrases for select using (true);
create index if not exists phrases_topic_idx on phrases(topic_id);

-- 5. Spaced-repetition progress per learner ----------------------------------
create table if not exists item_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('vocab', 'phrase')),
  item_id uuid not null,
  ease_factor numeric not null default 2.5,
  interval_days numeric not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  last_result text check (last_result in ('correct', 'wrong', 'partial')),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

alter table item_progress enable row level security;
create policy "item_progress_owner" on item_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists item_progress_due_idx on item_progress(user_id, due_at);

-- 6. Practice sessions ---------------------------------------------------------
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('mixed', 'speaking', 'listening', 'vocab')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  xp_earned integer not null default 0
);

alter table practice_sessions enable row level security;
create policy "practice_sessions_owner" on practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. Per-exercise events, used for weak-spot analytics -------------------------
create table if not exists session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('vocab', 'phrase')),
  item_id uuid not null,
  exercise_type text not null check (
    exercise_type in ('speak', 'listen_type', 'word_bank', 'mcq', 'match')
  ),
  correct boolean not null,
  response_ms integer,
  created_at timestamptz not null default now()
);

alter table session_events enable row level security;
create policy "session_events_owner" on session_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists session_events_user_item_idx on session_events(user_id, item_type, item_id);
