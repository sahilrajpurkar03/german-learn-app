-- Web Push subscriptions for daily reminders and the weekly recap.
-- Written by the server (service role) when the learner turns reminders on; learners can
-- see and delete their own subscriptions.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now(),
  last_sent_on date,
  last_recap_on date,
  failures integer not null default 0
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy push_subscriptions_select_own on public.push_subscriptions for select using ((select auth.uid()) = user_id);
create policy push_subscriptions_delete_own on public.push_subscriptions for delete using ((select auth.uid()) = user_id);
revoke insert, update on public.push_subscriptions from anon, authenticated;
