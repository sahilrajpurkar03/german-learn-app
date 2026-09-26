# Sprechen v2

Status (2026-09-24): built and tested locally. It sits behind a switch that is off by default, so production still serves v1 until the operator completes the steps below. It has **not** yet run against the production database, sent a real push notification, or had its German reviewed by a native speaker.

## What changed and why

v1 spread learning over nine views in one 979-line component, four separate review systems, two placement tests and two progress pages. It tested words before teaching them, accepted only exact answers, and kept most progress in one browser. v2 replaces this with:

- **One next step.** `/today` shows the streak, the daily-goal ring, **one** primary card chosen by `nextAction()` (level check → overdue reviews → next lesson), one secondary suggestion, and the week.
- **Four tabs:** Today · Course · Review · Me. Lessons, reviews and onboarding open in a full-screen player with no tab bar. Every screen has a URL.
- **A real course.** A1 has 10 units × 4 lessons, 200 words and phrases, 26 grammar patterns, a checkpoint per unit, and the 50 v1 situations as unit conversations. Every lesson follows the same structure: learn the new items (audio, emoji, gender colour, example) → check them → one grammar rule with drills → practice (build, gap, type) → dialogue.
- **Fair answer checking** (`lib/course/answer-check.ts`):
  - Several accepted answers per step.
  - `ae/oe/ue/ss` are accepted for umlauts, with a hint.
  - One-letter typos are accepted on longer words.
  - Articles, endings and pronouns must be exact.
  - Mistake-specific explanations for wrong options.
- **One memory model.** Every word, phrase, pattern, conversation reply and custom-lesson target is a row in `learner_items`, scheduled with SM-2 (`lib/srs.ts`) and graded from the verdict (no self-rating). Review exercises get harder as strength grows: recognise → build → type or speak.
- **Server-checked progress.** The browser sends only the raw answer. `/api/learning/attempts` rebuilds the exact step from its id, re-checks the answer, and writes events, memory, XP, daily activity, streak and lesson progress with the service role. Learners can read but not write these tables. This fixes the client-trusted `session_events` finding for v2.
- **Offline-tolerant.** Answers queue in IndexedDB and are re-sent on reconnect or when the tab is hidden. Attempt ids make re-sends harmless.
- **Habits.**
  - XP: 2 per correct answer, 1 after a retry, +10 per lesson, +5 per review.
  - Daily goal: 30, 50 or 80 XP.
  - Streak of goal days in the learner's timezone, with freezes (earn 1 per 7 days, hold up to 2).
  - No hearts: a wrong answer comes back once at the end of the lesson and goes into review.
- **Feel.**
  - Motion for React animations: step transitions, feedback sheet, right/wrong reveal, tile flights, progress, XP count-up, streak flame.
  - `canvas-confetti` on completion.
  - Synthesised sound effects (can be switched off) and Android vibration.
  - An SVG conversation partner that speaks, listens and reacts.
  - Light and dark theme from the logo palette; reduced-motion respected.
- **Natural voice.** 1,150 Piper (Thorsten, CC0) clips in `public/audio`, 9.2 MB. The browser voice is the fallback, and clips are cached for offline use.
- **Reminders.** Web Push at a chosen hour only if the goal is still open, plus a Sunday recap.

## Architecture map

| Area | Where |
|---|---|
| Course content | `app/src/content/a1/unit-*.ts`, `patterns.ts` (typed TS, zod-free, validated by tests) |
| Course engine | `app/src/lib/course/`: `build-lesson.ts`, `conversations.ts`, `custom.ts`, `catalog.ts`, `review.ts`, `memory.ts`, `activity.ts`, `progress.ts`, `next-action.ts`, `validate.ts`, `answer-check.ts` |
| Server | `app/src/lib/learning/`: `server.ts` (snapshot, `processBatch`), `actions.ts` (welcome, placement, settings), `push.ts`, `guard.ts`, `items.ts` |
| API | `app/src/app/api/learning/{attempts,import,custom-review}`, `app/src/app/api/push/{subscribe,dispatch}` |
| Screens | `app/src/app/(app)/…` (tabs), `app/src/app/(focus)/…` (player, onboarding), `app/src/app/demo` (public taster) |
| Player | `app/src/features/player/` (`engine.ts` reducer, `player.tsx`, `exercises/*`, `audio.ts`, `feedback-fx.ts`, `outbox.ts`) |
| Design system | tokens in `app/src/app/globals.css` (`--v2-*`, Tailwind `@theme`); primitives in `app/src/ui/` |
| Database | `supabase/migrations/0006_learning_v2.sql`, `0007_push_reminders.sql` |
| Audio | `app/scripts/audio-manifest.ts` → `app/scripts/tts-build.py` → `app/public/audio/*.mp3` |

## Operator setup (in this order)

1. **Back up the database**, then apply `supabase/migrations/0006_learning_v2.sql`, `0007_push_reminders.sql` and `0008_explicit_grants.sql` (Supabase CLI `db push`, or `scripts/run-sql.js`). They add new tables only and change nothing in v1.
2. **Check the server credentials already in Vercel:** `SUPABASE_SERVICE_ROLE_KEY` (v2 writes progress with it) and `CRON_SECRET` (at least 32 characters).
3. **Reminders (optional).** Run `npx web-push generate-vapid-keys` and set these in Vercel Production:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY` (server-only)
   - `VAPID_SUBJECT=mailto:<contact email>`

   Then schedule the hourly dispatch in the Supabase SQL editor:
   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;
   select vault.create_secret('<CRON_SECRET value>', 'sprechen_cron_secret');
   select cron.schedule('sprechen-reminders', '5 * * * *', $$
     select net.http_post(
       url := 'https://app-dusky-nine-52.vercel.app/api/push/dispatch',
       headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
         'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sprechen_cron_secret')),
       body := '{}'::jsonb);
   $$);
   ```
   Vercel Hobby cron runs only once a day, so it can't send reminders at each learner's own hour. That is why pg_cron triggers the dispatch.
4. **Deploy**, then open `/today?v2=1` on your phone. The cookie switches **only your browser** to v2; `?v2=0` switches back. Your v1 progress on that device is imported once when you first open v2.
5. **Verify with two real accounts:**
   - Complete a lesson and a review.
   - Check that XP, streak and memory appear in the tables and not for the other account.
   - Enable a reminder (on iPhone, install to the home screen first; iOS 16.4+).
6. **Switch everyone over** with `V2_DEFAULT=true` in Vercel. The old `/learn` URLs then redirect to the new screens.
7. **Later: retire v1.** Once v2 has been the default for a while and nobody needs v1, remove the v1 studio, `/preview`, `SessionRunner` and their tests, then drop `topics`, `vocab_items`, `phrases`, `item_progress`, `practice_sessions`, `session_events` and `personal_chapter_reviews` in a new migration. This was not done here because v1 is still the production default.

## Account & privacy, and Google sign-in

`/account` works in both app versions for any signed-in user. It is linked from **Me** in v2 and from the studio's progress view in v1. It lets the learner:
- change their name
- change their password (the current one is required), or set one if they signed up with Google
- read the privacy, data-sharing, security and imprint pages
- **download all their data** as JSON (`/api/account/export`, read through RLS)
- **clear Sprechen's data from this browser** (saved places, the offline queue, cached audio, preferences)
- **delete the account** after typing DELETE (`/api/account/delete`). This removes stored recordings first, then deletes the auth user; every table cascades.

Deletion and export have **not** been run against production yet. Try them once with a test account.

**Google sign-in** (`components/google-sign-in.tsx`) is hidden until it is configured:
1. **Google Cloud Console** → APIs & Services:
   - Set up the **OAuth consent screen** (External; app name Sprechen; your support email).
   - Go to **Credentials → Create credentials → OAuth client ID → Web application**.
   - Add this **Authorized redirect URI**: `https://<your-project-ref>.supabase.co/auth/v1/callback`. The exact value is shown in the next step.
2. **Supabase** → Authentication → **Sign In / Providers → Google**: enable it, paste the Client ID and Client secret, and save. Supabase shows the callback URL to use in step 1.
3. **Supabase** → Authentication → **URL Configuration**:
   - Set **Site URL** to `https://app-dusky-nine-52.vercel.app`.
   - Add these **Redirect URLs**: `https://app-dusky-nine-52.vercel.app/auth/callback` and, for previews, `https://*-sparc1.vercel.app/auth/callback`.
4. **Vercel** → Environment Variables: add `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` for **Production** (and Preview, with no branch selected). Then redeploy.

After Google sign-in, `/auth/callback?next=/learn` exchanges the code, uses the Google name instead of the default "Learner", and only redirects to same-site paths.

## When a lesson says "Your progress isn't saved yet"

The yellow box ends with a **Reference** such as `503 · events · 42501 · permission denied for table learning_events · key: jwt-anon`: HTTP status, the step that failed, the Postgres error code, the database's own words, and the kind of server key configured (never the key itself). The answers stay on the device and are sent again by "Try again".

| Reference contains | Meaning | Fix |
|---|---|---|
| `config · wrong-service-key`, or `key: jwt-anon` / `publishable` | `SUPABASE_SERVICE_ROLE_KEY` in Vercel holds the public key | Supabase → Project Settings → API keys: copy the **service_role** (legacy) or **secret** key into that variable (Production and Preview, no branch), then redeploy |
| `config · no-service-key`, `key: missing` | The variable is not set for Production | Add it, then redeploy |
| `42501 · permission denied` with `key: jwt-service_role` or `secret` | The tables lack grants for the service role | Run `0008_explicit_grants.sql` in the SQL editor |
| `42P01` or `PGRST205` | A migration has not been applied | Run `0006` and `0007` |
| `401 · auth` | The session expired | Sign in again |

## Authoring more content

## Authoring more content

Add a unit file in `app/src/content/<level>/`, register it in `index.ts`, and run `npm test`. The validator (`lib/course/validate.ts`) enforces:
- ids and articles are consistent
- 4–6 new items per lesson
- nothing is tested before it is introduced
- every lesson reuses earlier material
- every wrong drill option has an explanation
- dialogue replies accept at least 2 wordings
- build steps have distractors

Then regenerate audio (from `app/`):
```sh
npm run audio:manifest
python scripts/tts-build.py --voice <path>/de_DE-thorsten-high.onnx
```
Only new lines are synthesised. A test fails if any line lacks a clip.

The A1 German here was written and self-reviewed by the implementation (an AI). Before relying on it with learners, have a proficient speaker review `app/src/content/a1/`.

## Verification (local, 2026-09-24)

- `npm test`: 65 unit, database and content tests. Covers answer checking, memory, streaks and freezes, review planning, server-side rescoring of every lesson step, completion and checkpoint rules, legacy import mapping, reminder timing, custom lessons, the whole-course validator, audio coverage, and PGlite tests showing learners can read but not write XP, memory, events, streaks or push subscriptions.
- `npm run lint` and `npm run build` pass.
- `npx playwright test tests/v2.spec.ts`:
  - plays the real first lesson in `/demo` end to end, including a mistake that returns at the end
  - checks mistake feedback
  - checks a 320px phone with no horizontal scroll, and dark mode
  - checks that voice clips are public
  - checks that v2 pages and the API reject signed-out users
- The whole Playwright suite (94 tests: v1 regression, security, personal chapters, rollout switch, v2) passes against the production build with placeholder public Supabase settings.

**Not verified:**
- the migrations on the production project
- signed-in v2 screens against a real database (Today, Course, Review and Me need Supabase; locally they were checked by type-checking and a throwaway preview with sample data)
- real push delivery
- a human listening to the voice clips (only duration and loudness were checked)
- native-speaker review of the content
