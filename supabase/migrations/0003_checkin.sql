-- Adds a recurring progress check-in schedule (roughly every 7 days) so the
-- app can re-test the learner and adjust level / retire mastered items.
alter table profiles
  add column if not exists next_checkin_at timestamptz;
