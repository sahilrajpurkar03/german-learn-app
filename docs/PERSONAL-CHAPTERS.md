# Personal Chapters

Status: creation is enabled in Production. Supabase server access was repaired, and a replacement Groq key passed authentication and listed both configured models before deployment. The signed-in Groq organization shows the Free plan and Global ZDR enabled. The two daily generation attempts were consumed while diagnosing the original credentials; the quota correctly blocks another attempt until 00:00 UTC. No generated chapter or transcription has passed a live test. This is a limited personal beta, not unlimited free AI or certified language assessment.

## Remaining Setup (2026-09-13)

### Latest CLI Verification

Vercel CLI confirms the three server secrets are present in Production and the daily 03:00 UTC cleanup cron is enabled. The production creation flag was set to the exact value `true`. Signed-in library access returns 200 with `available: true`; unauthenticated library and cleanup access return 401. Merely having the secret entries did not establish correct credentials: the first synthetic generation request failed at storage, before reserving a job. The intended project's service-role key was verified privately, copied into the existing Production Secret entry without rotating it, and redeployed. A rolled-back database test also verified reservation as `service_role` without retaining synthetic records.

Two subsequent synthetic generation attempts reached the provider stage but failed without saving a chapter. Safe error classification deployed in `5a9141b` identified provider access rejection (401/403), not malformed learner text. Raw provider responses, keys, and input text are not included in these errors. The operator then supplied a replacement Groq key through a hidden terminal prompt. A read-only request to the model-list endpoint authenticated successfully and found `openai/gpt-oss-120b` and `whisper-large-v3-turbo`; the key was saved as a Production Secret and redeployed in `dpl_EkykfaNdaDDKVRXtCS7z2yqVA3o3` (Ready). The key was not printed or written to the repository. Model-list access does not establish successful inference.

Both daily generation attempts count; quotas were not reset or relaxed. A subsequent live check returned the expected 429 daily-limit response without another generation. The library returned 200 with `available: true` and zero saved chapters after one transient sign-in response. Successful generation must be checked after 00:00 UTC; authenticated cleanup execution, live transcription, and generated German quality remain unverified. No billing plan, provider privacy setting, application quota, consent check, or ownership control was changed.

Supabase project `idoigmkvqnyrpifcvfqn` (German-Learn-App, Frankfurt) now has migrations `0001` through `0005` recorded. Before recording the existing baseline, 116 schema definitions were compared with `0001`-`0003`: columns, constraints, indexes, RLS policies, functions, and the signup trigger matched. The subsequent CLI dry run selected only `0004` and `0005`, and both were applied successfully.

Production checks confirm all four personal-chapter tables have RLS enabled, the audio bucket is private with a 10 MB limit, both audio policies exist, and only the service role can execute the reservation function. Migration `0005_session_event_ownership.sql` adds the validated composite parent-owner foreign key and tightens the event policy. Production has zero mismatched event/session owners. These catalog checks do not replace two-account tests against the deployed APIs.

**Pre-migration backup verified for the affected schemas:** portable PostgreSQL 17.11 tools created a full custom-format archive and password-free role metadata outside Git, under `%LOCALAPPDATA%\Sprechen\backups\pre-personal-chapters`. Folder access is restricted to the current Windows user and SYSTEM. The 313,702-byte archive has 570 catalog entries and passed full payload decoding. An isolated, password-protected local PostgreSQL restore of `public`, `auth`, and `storage` succeeded; existing row counts matched across 38 tables, and both migrations succeeded on that restored copy before production application. Ownership was remapped for the local rehearsal. This is not a verified full Supabase-service restore: managed extensions, role passwords, Vault keys, and Storage object bytes need separate recovery handling. The files are access-restricted, not independently encrypted; provider recovery points and recurring/off-device backups remain unverified.

- **Vercel:** the production site, master-branch automatic deployments, `app/` root, Production scopes for the three server secrets, and active cleanup schedule are verified through CLI. The repaired Supabase and Groq credentials have been deployed. Creation is enabled despite the remaining verification gaps; unset the flag or set it to `false` and redeploy to disable new creation. Authenticated cleanup execution remains unverified.
- **Supabase:** CLI access, migration deployment, database permissions, the affected-schema restore rehearsal, and the repaired server credential's job access are verified. Two-account database/Storage API isolation remains unverified. Production login worked in the shared browser; real signup/recovery email delivery, full-service disaster recovery, and administrator MFA still need checks.
- **Groq:** the signed-in organization's dashboard confirms Free ($0), Global ZDR enabled, Inference ZDR enabled, and Batch plus fine-tuning/LoRA storage off. Those settings were inspected, not changed. The original key was rejected; its replacement authenticates and lists both configured models. The model-list response does not identify the key's organization or prove inference permissions. Usage can lag by 15 minutes. No live generation or transcription benchmark has passed; complete a synthetic smoke test, review German quality, and check consented device audio before relying on generated lessons or submitting personal recordings.
- **App limitations beyond provider setup:** detailed built-in recall/checkpoints remain device-local; full account export/deletion and local-data clearing are incomplete. Legacy score integrity remains unresolved; the parent-session database ownership constraint is now deployed. Physical phone/browser speech behavior and authenticated production workflows have not been established by mocked browser tests.

These are verification gaps, not a claim that every setting is absent. No provider settings, feature switches, or production database records were changed during the mobile audit.

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

The operator's supplied name, full address (Emil-Figge-Str. 21, 44227 Dortmund, Germany), and email are public defaults in [legal.ts](../app/src/lib/legal.ts). The address was supplied for publication on 2026-09-12 and is treated as operator-confirmed, not independently verified or legally certified. `LEGAL_OPERATOR_NAME`, `LEGAL_OPERATOR_ADDRESS`, and `LEGAL_CONTACT_EMAIL` can override them at build time. A custom address requires `LEGAL_OPERATOR_ADDRESS_CONFIRMED=true` after checking it; do not confirm only a town/postcode/country. Setting that flag to `false` also marks the default address unconfirmed. Rebuild after changing these settings. The contact email stays visible independently of address confirmation.

On 2026-09-12, after receiving the ZDR setup guidance, the operator reported that the Groq settings were completed. The effective dashboard configuration has not been independently verified by this implementation. This report does not confirm API-key configuration, database migration, cleanup operation, account isolation, or a live benchmark. Keep creation disabled until the launch gates above are confirmed.

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

At the original benchmark attempt, no Groq key was configured and the live command reported **blocked**, with no provider calls. The operator later added the variable name in Vercel; its value and effective Production configuration have not been validated. ASR accuracy, real AI latency/token use, generated German quality, and production account isolation remain unverified.

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