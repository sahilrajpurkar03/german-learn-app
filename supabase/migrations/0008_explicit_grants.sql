-- State the table permissions of the v2 tables explicitly instead of relying on Supabase's
-- automatic default privileges (which can differ between projects and are being tightened).
-- Learners can read their own rows (row-level security limits which); only the server, using
-- the service role, can write learning data. Safe to run more than once.

grant select on
  public.learner_items, public.learning_events, public.daily_activity,
  public.lesson_progress, public.learner_stats, public.push_subscriptions
to authenticated;

grant select, insert, update on public.learner_settings to authenticated;
grant delete on public.push_subscriptions to authenticated;

grant all on
  public.learner_settings, public.learner_items, public.learning_events, public.daily_activity,
  public.lesson_progress, public.learner_stats, public.push_subscriptions
to service_role;

grant execute on function public.prune_learning_events() to service_role;
