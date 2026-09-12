# Personal Chapters

Status: implemented behind an operator-controlled creation switch; not enabled or tested against live Groq/Supabase accounts. Free-plan configuration and a German quality review are launch gates. This is a limited personal beta, not unlimited free AI or certified language assessment.

## Workflow

- My Chapters accepts a typed recap, a short microphone recording, or a selected MP3/M4A/WAV/WebM/Ogg/FLAC file (3 minutes, 10 MB maximum). Unsupported or unreadable files have a text fallback.
- Audio is transcribed first. The learner corrects/redacts the transcript and confirms it before generating a chapter. Redaction after transcription cannot undo the provider's earlier receipt of audio.
- The learner supplies a communication goal, A1/A2/B1 level, and Sie/du register. AI proposes 3-6 source-linked targets, including a verb and a phrase, and two 4-6-turn scenarios. The prompt requests four turns per scenario.
- Original means a reconstruction of the communication goal, not a verbatim recording. Variation changes one constraint. Both use the existing guided player; ordinary replay makes no AI generation calls.
- Personal chapters, checkpoints, and chosen phrase reviews sync privately through Supabase. Review uses the existing SM-2 scheduler and explicit self-ratings. Unrecognized free replies use an ungraded comparison, not an incorrect-answer claim.
- Export downloads one chapter and its review/progress data as JSON. Delete removes that chapter plus associated checkpoints and reviews. JSON import and a generated-content editor are not included in this beta.
- Unsaved creator text is held in page memory only. Leaving or reloading loses it. The public preview has a clearly labelled, hand-authored sample, never fake AI generation.

## Private Setup

Do not put credentials in chat, source, screenshots, or tracked environment files. Configure secrets privately in the local environment and deployment dashboard. No configuration file was edited by the agent.

1. Review and apply [0004_personal_chapters.sql](../supabase/migrations/0004_personal_chapters.sql) to the intended Supabase project after backing up existing data. It creates separate owner-restricted tables and a private audio bucket; it does not insert private material into the existing public content tables.
2. Create/use a Groq **Free** project. Do not upgrade to Developer or configure paid fallback. Verify model availability and actual organization quotas. In [Groq Data Controls](https://console.groq.com/settings/data-controls), enable **Global ZDR** for a dedicated Sprechen organization. Confirm inference retention is disabled and Batch plus Fine-tuning & LoRA features are off or locked off. Sprechen only uses transcription and chat inference, so it does not need those storage-dependent features. If the organization also serves other apps that need them, enable **Inference APIs ZDR** instead and review the other apps' retention separately. Do not disable another app's required features without checking its needs. ZDR still permits the processing needed to answer requests and collection of usage metadata; it does not establish EU-only processing or GDPR compliance. Review the processing agreement and international transfers before using personal data.
3. Configure server-only `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and a random `CRON_SECRET` of at least 32 characters. The existing public Supabase URL/anon key are still needed. Never use a `NEXT_PUBLIC_` prefix for these secrets.
4. Leave `PERSONAL_CHAPTERS_ENABLED` unset/false until the migration, permissions, disclosure/contact details, consent process, and cleanup schedule have been verified. Set it to `true` only for the approved beta. Missing configuration disables creation while preserving access to saved chapters.
5. Deploy with `app/` as the Vercel project root. [vercel.json](../app/vercel.json) schedules cleanup daily at 03:00 UTC. Verify the cron is active and authenticated with `CRON_SECRET`. Local `next start` does not run that cron automatically; invoke it through an authorized local operator process when testing real uploads.
6. Test two independent test accounts against the actual deployed database and Storage API. Verify neither can read, update, delete, or upload under the other's identity. Local SQL tests do not establish that the migration was deployed.

### Public Legal Contact

The operator's supplied name, locality, and email are public defaults in [legal.ts](../app/src/lib/legal.ts). `LEGAL_OPERATOR_NAME`, `LEGAL_OPERATOR_ADDRESS`, and `LEGAL_CONTACT_EMAIL` can override them at build time. A locality alone is not a confirmed full postal address. Supply the full appropriate postal address privately in deployment settings, then set `LEGAL_OPERATOR_ADDRESS_CONFIRMED=true` and rebuild only after checking it. This flag records the operator's confirmation, not an automated legal compliance assessment. Do not set it for only a town/postcode/country. The contact email stays visible even while the legal notice remains a draft.

The settings pasted by the operator on 2026-09-12 showed Global ZDR and Inference APIs ZDR disabled, with Batch and Fine-tuning & LoRA on. They have not been changed or independently verified by this implementation. Keep creation disabled until retention and the other launch gates are confirmed.

## Cost Controls

- Database reservation limits: 2 transcription attempts and 2 generation attempts per learner per UTC day; 20 of each across the app per UTC day. Cancelled and failed reservations count, preventing retry abuse. Exact account quotas may be lower.
- A global 75-second generation spacing protects the shared token-per-minute budget. There is no hidden unlimited queue: the learner receives a retry message and keeps the open draft.
- One generation request is limited to 3,000 transcript characters and 4,000 completion tokens. Groq automatic retries are disabled. Network retry reuses the request identifier; a saved chapter is returned instead of generated again. Clear provider/validation failures permit a new attempt.
- The library cap is 100 saved chapters per account. Hosting, database, Storage, and egress remain subject to their own free-plan quotas; there is no unlimited storage promise.
- Default provider candidates: `whisper-large-v3-turbo` for transcription, `openai/gpt-oss-120b` for structured chapter generation. No tools, web searches, dynamic code execution, generated images, paid voice API, or provider failover are used.
- Device speech synthesis is reused. Voice availability and remote/local processing depend on browser/OS; no universal offline or pronunciation-accuracy guarantee is made.

## Data Lifecycle and Security

- Cookie-authenticated server endpoints independently verify the user. Mutations require a same-origin JSON request with a bounded body. AI keys and the Supabase service role stay server-side.
- Direct browser uploads use the logged-in Supabase session and Storage RLS for an exact reserved path. There are no public audio URLs or unrestricted uploads. Upsert/overwrite is not enabled.
- The server checks bytes and parses duration with `music-metadata` before transcription. Chromium's MediaRecorder WebM duration is finalized with `fix-webm-duration`; microphone tracks stop on stop/unmount. A virtual Chromium microphone test checks the actual produced file, not speech accuracy.
- Audio removal runs on completion/failure/discard. Job/path records expire after 24 hours, with daily cleanup retrying removal and deleting temporary transcripts/jobs. Normal scheduling can take about 48 hours from creation; outages require intervention. Paths are kept until that sweep to cover late upload completion.
- Saved chapters contain only generated lesson data and short source excerpts, not the full reviewed transcript. Treat excerpts and exports as personal data. No raw request bodies/provider error payloads are intentionally logged by this feature.
- JSON schema and additional consistency checks reject broken exercises, duplicate targets, missing source quotations, wrong level/register, and identical variations. This does **not** prove correct German or semantic faithfulness; prompt injection is treated as untrusted source text, and generated output is rendered as text with fixed local assets.
- Progress is for personal study, not trusted ranking/certification. A complete account export/deletion process and an independent penetration test remain outside this feature.

## Verification Commands

Verified locally on 2026-09-12: 24 unit/SQL tests, all 70 production-build browser tests, scoped lint, and the production build passed. After final image/copy polish, all 8 focused personal-workflow tests passed again, including 320px primary actions. Production dependency audit found 0 known vulnerabilities. Final replay measurement: p95 114.1 ms, nodes/listeners stable at 700/341; provider creation/transcription were mocked. Earlier runs measured 69.6-74.8 ms. Local timings vary and are not production guarantees.

Run from `app/`:

```sh
npm test
npm run build
npm run test:personal
npm run test:e2e
npm run benchmark:personal
```

`npm test` includes an isolated Postgres/PGlite migration test with separate users/roles, quota enforcement, reserved upload paths, and owner-bound parent relationships. Browser creation/transcription/storage responses are mocked unless explicitly identified as real anonymous API guard checks. The recorder test uses a virtual microphone.

The local benchmark measures 1,000 schema-validation and mission-adaptation iterations, not AI performance. On 2026-09-12 it measured p50 0.0425 ms, p95 0.1041 ms, and a 3,413-byte sample. A 30-cycle local Chromium replay run measured p95 69.6 ms with nodes/listeners stable at 703/341 and zero generation calls. These are local screening observations, not production SLAs or long-term leak proof.

### Live Benchmark Gate

The user confirmed no Groq key is configured. The live command was executed and reported **blocked**, with no provider calls. ASR accuracy, real AI latency/token use, generated German quality, and production account isolation remain unverified.

After privately configuring a **Free-plan** key and setting `GROQ_BENCHMARK_FREE_PLAN_CONFIRMED=true`:

```sh
npm run benchmark:personal:live
npm run benchmark:personal:live -- --20b
```

Each invocation makes at most one generation call with a synthetic meeting scenario, never an uploaded learner recording, and saves a report under ignored `app/test-results/`. Run comparisons sequentially with the account's rate limits in mind. A single call per model is a smoke comparison, not a statistical benchmark. A blocked report returns a nonzero exit status, not a passing status; provider/validation failures also return nonzero.

Before enabling real users, review synthetic scenarios across A1/A2/B1, both registers, and multiple everyday topics with a proficient German reviewer. Check source fidelity, idiomatic phrasing, grammatical correctness, answer ambiguity, useful target reuse, and whether the variation genuinely requires transfer. Then use explicitly consented self-recordings to assess Indian-accented English, German, noise/silence, and actual iPhone/Android formats. Do not upload another person's recording for a benchmark without permission.

## Provider References

- [Groq speech-to-text](https://console.groq.com/docs/speech-to-text)
- [Groq quotas](https://console.groq.com/docs/rate-limits)
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs)
- [Groq data controls](https://console.groq.com/docs/your-data)
- [Supabase private storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Vercel payload limits](https://vercel.com/docs/functions/limitations#request-body-size)
- [Locally served personal-chapter photo](https://images.unsplash.com/photo-1455390582262-044cdead277a) (Unsplash)

References were checked during design on 2026-09-12. Recheck actual provider terms and account limits before activation.