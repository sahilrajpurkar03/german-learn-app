alter table public.practice_sessions
  add constraint practice_sessions_id_user_id_key unique (id, user_id);

alter table public.session_events
  add constraint session_events_session_owner_fkey
  foreign key (session_id, user_id)
  references public.practice_sessions(id, user_id) on delete cascade;

alter policy session_events_owner on public.session_events
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.practice_sessions parent
      where parent.id = session_events.session_id
        and parent.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.practice_sessions parent
      where parent.id = session_events.session_id
        and parent.user_id = (select auth.uid())
    )
  );