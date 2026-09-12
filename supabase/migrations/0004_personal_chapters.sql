create table public.personal_chapters (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  blueprint jsonb not null check (jsonb_typeof(blueprint) = 'object' and octet_length(blueprint::text) <= 40000),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.personal_chapter_progress (
  chapter_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant text not null check (variant in ('original', 'variation')),
  turn_index integer not null default 0 check (turn_index between 0 and 6),
  correct integer not null default 0 check (correct between 0 and turn_index),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (chapter_id, variant),
  foreign key (chapter_id, user_id) references public.personal_chapters(id, user_id) on delete cascade
);

create table public.personal_chapter_reviews (
  chapter_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_index integer not null check (target_index between 0 and 5),
  ease_factor numeric not null default 2.5 check (ease_factor >= 1.3),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  due_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chapter_id, target_index),
  foreign key (chapter_id, user_id) references public.personal_chapters(id, user_id) on delete cascade
);

create table public.personal_chapter_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('transcribe', 'generate')),
  input_digest text not null check (length(input_digest) = 64),
  status text not null check (status in ('awaiting_upload', 'ready', 'processing', 'complete', 'failed', 'cancelled')),
  audio_path text,
  output jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create index personal_chapters_owner on public.personal_chapters(user_id, created_at desc);
create index personal_reviews_due on public.personal_chapter_reviews(user_id, due_at);
create index personal_jobs_quota on public.personal_chapter_jobs(kind, created_at, user_id);

alter table public.personal_chapters enable row level security;
alter table public.personal_chapter_progress enable row level security;
alter table public.personal_chapter_reviews enable row level security;
alter table public.personal_chapter_jobs enable row level security;

revoke all on public.personal_chapters, public.personal_chapter_progress, public.personal_chapter_reviews, public.personal_chapter_jobs from anon, authenticated;
grant select on public.personal_chapters, public.personal_chapter_progress, public.personal_chapter_reviews, public.personal_chapter_jobs to authenticated;
grant all on public.personal_chapters, public.personal_chapter_progress, public.personal_chapter_reviews, public.personal_chapter_jobs to service_role;

create policy personal_chapters_owner_read on public.personal_chapters for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_progress_owner_read on public.personal_chapter_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_reviews_owner_read on public.personal_chapter_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_jobs_owner_read on public.personal_chapter_jobs for select to authenticated using ((select auth.uid()) = user_id);

create function public.reserve_personal_chapter_job(actor uuid, job_id uuid, job_kind text, digest text, audio_extension text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous public.personal_chapter_jobs;
  day_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  if job_kind not in ('transcribe', 'generate') or length(digest) <> 64 then
    raise exception 'Invalid job';
  end if;
  if job_kind = 'transcribe' and (audio_extension is null or audio_extension not in ('mp3', 'm4a', 'wav', 'webm', 'ogg', 'flac')) then
    raise exception 'Unsupported audio';
  end if;
  perform pg_advisory_xact_lock(842921);
  select * into previous from public.personal_chapter_jobs where id = job_id;
  if found then
    if previous.user_id <> actor or previous.input_digest <> digest or previous.kind <> job_kind then
      return 'conflict';
    end if;
    return 'existing';
  end if;
  if (select count(*) from public.personal_chapter_jobs where user_id = actor and kind = job_kind and created_at >= day_start) >= 2 then
    return 'user_limit';
  end if;
  if (select count(*) from public.personal_chapter_jobs where kind = job_kind and created_at >= day_start) >= 20 then
    return 'global_limit';
  end if;
  if job_kind = 'generate' and exists (select 1 from public.personal_chapter_jobs where kind = 'generate' and created_at > now() - interval '75 seconds') then
    return 'busy';
  end if;
  insert into public.personal_chapter_jobs(id, user_id, kind, input_digest, status, audio_path)
  values(job_id, actor, job_kind, digest, case when job_kind = 'transcribe' then 'awaiting_upload' else 'ready' end,
    case when job_kind = 'transcribe' then actor::text || '/' || job_id::text || '.' || audio_extension else null end);
  return 'reserved';
end;
$$;

revoke all on function public.reserve_personal_chapter_job(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_personal_chapter_job(uuid, uuid, text, text, text) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('personal-chapter-audio', 'personal-chapter-audio', false, 10485760,
  array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac']);

create policy personal_audio_reserved_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'personal-chapter-audio' and exists (
    select 1 from public.personal_chapter_jobs job
    where job.user_id = (select auth.uid()) and job.audio_path = name and job.kind = 'transcribe'
      and job.status = 'awaiting_upload' and job.created_at > now() - interval '15 minutes'
  )
);

create policy personal_audio_owner_read on storage.objects for select to authenticated using (
  bucket_id = 'personal-chapter-audio' and exists (
    select 1 from public.personal_chapter_jobs job where job.user_id = (select auth.uid()) and job.audio_path = name
  )
);