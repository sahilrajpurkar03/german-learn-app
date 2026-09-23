# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- `app/`: the Next.js app ("Sprechen", a German-learning PWA). This is also the Vercel project root. Run all npm commands from here.
- `supabase/migrations/`: numbered SQL migrations (`0001`–`0007`), applied to the production Supabase project in order. Add new migrations as the next number. Never edit an applied migration. `0006`/`0007` (v2) may not be applied in production yet; check `docs/SPRECHEN-V2.md`.
- `scripts/`: one-off operator helpers (`run-sql.js` applies a SQL file using `PG*` env vars; SQL for cleaning up test users).
- `docs/`: status and design records. `SPRECHEN-V2.md` is the v2 architecture and operator runbook. `PERSONAL-CHAPTERS.md`, `ADAPTIVE-PRACTICE.md` and `SECURITY-REVIEW.md` describe v1 and the AI chapters. They record what has and has not been verified. Update them when a change affects verification status, and keep the same careful tone: state exactly what was verified and don't overclaim.

**Next.js version warning** (from `app/AGENTS.md`, which `app/CLAUDE.md` imports): this is Next.js 16 with breaking changes compared with older versions. Before writing Next-specific code, read the relevant guide in `app/node_modules/next/dist/docs/`. For example, middleware now lives in `src/proxy.ts` and exports `proxy`. `next dev` re-adds that AGENTS.md block, so commit it rather than reverting it.

## Commands (run from `app/`)

```sh
npm run dev            # next dev --webpack (service worker disabled in dev)
npm run build          # next build --webpack (also type-checks)
npm run lint           # eslint
npm test               # node:test unit + content-validation + PGlite SQL tests (explicit file list in package.json)
npm run test:e2e       # Playwright; serves the *production build* on 127.0.0.1:3200, so run `npm run build` first
npx playwright test tests/v2.spec.ts   # v2 player end-to-end via the public /demo
npm run audio:manifest # list every German line → .audio-manifest.json (then scripts/tts-build.py makes the mp3s)
```

Single tests:
- Unit: `node --experimental-strip-types --test src/lib/course/course.test.ts` (any single file). **New unit test files must be added to the explicit list in the `test` script**, or `npm test` won't run them.
- E2E: `npx playwright test tests/regression.spec.ts -g "<title substring>"`.

Unit tests run TypeScript directly via Node type stripping. That is why modules in `src/lib` and `src/content` that tests import use relative imports with explicit `.ts` extensions and avoid the `@/` alias and TS-only syntax such as enums. Keep that pattern for any lib code that tests reach.

Local builds and E2E runs need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set. Placeholder values are enough for the public pages and the tests, because signed-out users are redirected. Browser tests mock speech recognition, Groq and personal-chapter API responses, so passing E2E tests do not show that live providers work.

## Two app versions side by side

**v2 is the new architecture; v1 still serves production until the rollout switch is on.**
- The switch lives in `lib/feature-flags.ts` and `lib/v2.ts`. Visiting `?v2=1` or `?v2=0` sets the `sprechen-v2` cookie through the proxy. `V2_DEFAULT=true` turns v2 on for everyone.
- When v2 is on, the v1 `/learn*` pages redirect to their v2 equivalents.
- Every v2 page goes through `requireLearner()` / `requireSnapshot()` in `lib/learning/guard.ts`.

### v2 (see `docs/SPRECHEN-V2.md`)

**Routes**
- `src/app/(app)/`: the four tabs (Today · Course · Review · Me) plus `/custom`, sharing a tab-bar layout.
- `src/app/(focus)/`: the full-screen player (`/lesson/[id]`, `/review/session`) and onboarding (`/welcome`, `/placement`).
- `src/app/demo`: public, plays the first lesson with nothing saved.

**Content → steps**
- Authored content: `src/content/a1/unit-*.ts` (items, lesson specs, sentences, dialogues) and `patterns.ts` (grammar).
- `lib/course/catalog.ts` builds lessons deterministically (`build-lesson.ts`, `conversations.ts` for the 50 v1 missions, `custom.ts` for AI personal chapters).
- Step ids (`<lessonId>~<slug>`, review steps `R~<itemKey>~<type>~<variant>`) are stable, so `findStep(id)` can rebuild exactly what the learner saw.
- `lib/course/validate.ts` enforces the authoring rules. `course.test.ts` runs it over the whole course, plus a check that every German line has a clip in `public/audio`.

**Scoring and memory**
- `lib/course/answer-check.ts` is the single checker: umlaut folding, typo tolerance, strict "critical" tokens.
- `memory.ts` is SM-2 over `lib/srs.ts`, where early practice never postpones an item. `activity.ts` covers XP, goal and streak with freezes. `progress.ts` holds the pure scoring and completion rules, shared by the server and the demo.

**Server truth**
- The player (`features/player/`, a pure reducer in `engine.ts`) queues answers in IndexedDB (`outbox.ts`) and posts them to `/api/learning/attempts`.
- `lib/learning/server.ts#processBatch` re-scores each answer with `findStep` + `checkAnswer` and writes the tables from migration `0006` using the service role.
- Learners can only SELECT those tables (tested in `tests/learning-storage.test.mjs`); `learner_settings` is the one learner-writable table. Never let the client write XP, memory or progress directly.

**One memory table**
- Every learnable thing is a `learner_items` row keyed by id prefix: `w.` word, `p.` phrase, `g.` grammar pattern, `t.<mission>.<turn>` conversation reply, `c.<chapterId>.<n>` custom-lesson target.
- Review sessions come from `planReview()` and `reviewStepFor()`, which pick harder exercise types as `strength` grows.

**UI**
- Design tokens are the `--v2-*` CSS variables in `globals.css`, exposed as Tailwind utilities (`bg-canvas`, `text-ink`, `bg-brand`, `text-der/die/das`, …), with light and dark variants.
- Primitives are in `src/ui/`. Motion for React runs under `MotionProvider` (LazyMotion `domMax`, strict: use `m.*`, not `motion.*`).
- Audio is `features/player/audio.ts`: pre-generated clips first, browser TTS as fallback.

### v1 (legacy, still default)

`/learn` renders `components/studio/learning-studio.tsx`, a single component that switches views with `useState`. Progress is split three ways:
1. Legacy cloud sessions: `lib/content.ts` and `lib/session-actions.ts` against tables `0001`–`0003`, with client-trusted correctness.
2. The studio's localStorage record `sprechen-studio-v1:<userId>` (`studio-store.ts`). v2 imports this once via `/api/learning/import`.
3. Personal AI chapters.

Personal chapters (`/api/personal-chapters` → `lib/personal-chapter-server.ts`: Groq generation and transcription, quota via `reserve_personal_chapter_job`, cleanup cron) serve both versions. v2 plays them through its own player and embeds the v1 `ChapterCreator` for creation. Keep the guarantees in `docs/PERSONAL-CHAPTERS.md`. The Playwright suites `regression.spec.ts` and `personal-chapters.spec.ts` cover v1 through `/preview` and CSS class selectors.

## Auth and routing

`src/proxy.ts` → `lib/supabase/middleware.ts` refreshes the Supabase session and redirects signed-out users to `/login`, except for the public pages (`/preview`, `/demo`, legal pages) and everything under `/api/`. API routes authenticate the user themselves and answer 401. The proxy matcher also skips static assets, including `/audio/*.mp3`. Security headers are set in `next.config.ts`.

The service worker (`src/app/sw.ts` → `public/sw.js`, Serwist):
- caches only same-origin public assets, and caches voice clips cache-first;
- purges any cached private routes when it activates;
- handles push notifications and notification clicks.

## Environment variables

Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` (`true` shows "Continue with Google"; Google must be enabled in Supabase first). In Vercel, give every variable **Production** and **Preview** with no branch selected. A branch-scoped variable can't be Production, and that once took production login down.
Server-only (never prefix with `NEXT_PUBLIC_`): `SUPABASE_SERVICE_ROLE_KEY` (v2 progress writes and personal chapters), `GROQ_API_KEY`, `CRON_SECRET` (≥32 chars, also authorizes `/api/push/dispatch`), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
Flags: `V2_DEFAULT=true` makes v2 the default. `PERSONAL_CHAPTERS_ENABLED=true` enables AI chapter creation; if it's missing, or any server secret is missing, creation is disabled but saved chapters stay readable.
Legal disclosure overrides (build time): `LEGAL_OPERATOR_NAME`, `LEGAL_OPERATOR_ADDRESS`, `LEGAL_CONTACT_EMAIL`, `LEGAL_OPERATOR_ADDRESS_CONFIRMED`. Defaults are in `lib/legal.ts`.

## Account

`/account` (outside the v2 route groups, so it works in both versions) holds name, password, data export (`/api/account/export`), clearing this device's data, and account deletion (`/api/account/delete`: removes recordings from Storage, then `auth.admin.deleteUser`; all tables cascade). `/auth/callback` serves both password-reset links and Google OAuth (`?next=`, same-site paths only).

## Database changes

Migrations enable RLS on every table and bind child rows to their owner through composite foreign keys (`0005`). v2 tables (`0006`) are read-only for learners; writes go through the service role on the server. Owner isolation and permissions are tested locally by running the migration SQL in PGlite (`app/tests/personal-storage.test.mjs`, `app/tests/learning-storage.test.mjs`, `src/lib/personal-chapters.test.ts`) with a stubbed `auth` schema and Supabase-style default grants. Extend those tests when you change policies. Update `lib/supabase/database.types.ts`, `lib/personal-database.ts` and `lib/learning/tables.ts` by hand to match.

Deployment: pushes to `master` auto-deploy to Vercel production.
