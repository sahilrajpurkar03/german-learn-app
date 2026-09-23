-- Sprechen v2: one memory model, one event log, server-computed XP and streaks.
--
-- Learners can READ their own rows. Every learning table is WRITTEN only by the server
-- (service role) after it re-scores the learner's answer, so progress, XP and streaks
-- cannot be edited from the browser. Settings are the learner's own choices and stay
-- learner-editable.

-- 1. Settings --------------------------------------------------------------------
create table if not exists public.learner_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal_xp integer not null default 30 check (daily_goal_xp in (30, 50, 80)),
  timezone text not null default 'Europe/Berlin' check (char_length(timezone) between 1 and 64),
  reminder_hour integer check (reminder_hour between 0 and 23),
  sound_on boolean not null default true,
  motivation text check (char_length(motivation) <= 60),
  start_unit integer not null default 1 check (start_unit between 1 and 30),
  placed_at timestamptz,
  legacy_imported_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.learner_settings enable row level security;
create policy learner_settings_select_own on public.learner_settings for select using ((select auth.uid()) = user_id);
create policy learner_settings_insert_own on public.learner_settings for insert with check ((select auth.uid()) = user_id and legacy_imported_at is null);
create policy learner_settings_update_own on public.learner_settings for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- The import marker is written by the server only; learners cannot fake or clear it.
create or replace function public.protect_learner_settings() returns trigger
language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    new.legacy_imported_at := old.legacy_imported_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger learner_settings_protect before update on public.learner_settings
  for each row execute function public.protect_learner_settings();

-- 2. Memory: one row per learner and item -------------------------------------------
create table if not exists public.learner_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 3 and 120),
  ease numeric not null default 2.5,
  interval_days numeric not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  strength real not null default 0 check (strength between 0 and 1),
  lapses integer not null default 0,
  seen_count integer not null default 0,
  correct_count integer not null default 0,
  introduced_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source text not null default 'course' check (source in ('course', 'conversation', 'custom', 'legacy')),
  primary key (user_id, item_key)
);
create index if not exists learner_items_due_idx on public.learner_items (user_id, due_at);
alter table public.learner_items enable row level security;
create policy learner_items_select_own on public.learner_items for select using ((select auth.uid()) = user_id);

-- 3. Event log (answers), kept 90 days ------------------------------------------------
create table if not exists public.learning_events (
  attempt_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  lesson_id text not null check (char_length(lesson_id) <= 120),
  step_id text not null check (char_length(step_id) <= 240),
  item_keys text[] not null default '{}',
  exercise_type text not null check (char_length(exercise_type) <= 20),
  verdict text not null check (verdict in ('correct', 'close', 'wrong', 'seen', 'complete')),
  retry boolean not null default false,
  xp integer not null default 0 check (xp between 0 and 50),
  answer text check (char_length(answer) <= 500),
  response_ms integer check (response_ms between 0 and 3600000),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index if not exists learning_events_user_time_idx on public.learning_events (user_id, occurred_at desc);
create index if not exists learning_events_run_idx on public.learning_events (user_id, run_id);
alter table public.learning_events enable row level security;
create policy learning_events_select_own on public.learning_events for select using ((select auth.uid()) = user_id);

-- 4. Daily activity (drives the goal ring, week strip and streak) ------------------------
create table if not exists public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  xp integer not null default 0,
  graded_steps integer not null default 0,
  lessons integer not null default 0,
  reviews integer not null default 0,
  goal_xp integer not null default 30,
  goal_met boolean not null default false,
  freeze_used boolean not null default false,
  primary key (user_id, local_date)
);
alter table public.daily_activity enable row level security;
create policy daily_activity_select_own on public.daily_activity for select using ((select auth.uid()) = user_id);

-- 5. Lesson progress -----------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) <= 120),
  status text not null check (status in ('started', 'completed')),
  step_index integer not null default 0 check (step_index between 0 and 200),
  best_score real check (best_score between 0 and 1),
  completed_count integer not null default 0,
  last_run_id uuid,
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create policy lesson_progress_select_own on public.lesson_progress for select using ((select auth.uid()) = user_id);

-- 6. Totals and streak ---------------------------------------------------------------
create table if not exists public.learner_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp_total integer not null default 0,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  streak_last_date date,
  freezes integer not null default 0 check (freezes between 0 and 2),
  freeze_progress integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.learner_stats enable row level security;
create policy learner_stats_select_own on public.learner_stats for select using ((select auth.uid()) = user_id);

-- Only the server writes learning data.
revoke insert, update, delete on public.learner_items, public.learning_events, public.daily_activity, public.lesson_progress, public.learner_stats from anon, authenticated;

-- 7. Retention: events older than 90 days are removed by the daily cleanup route.
create or replace function public.prune_learning_events() returns integer
language sql security definer set search_path = public as $$
  with removed as (delete from public.learning_events where received_at < now() - interval '90 days' returning 1)
  select count(*)::integer from removed;
$$;
revoke all on function public.prune_learning_events() from public, anon, authenticated;
