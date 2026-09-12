# Focused Security Review

Date: 2026-09-11. Scope: repository auth/data paths, PWA caching, public legal access, browser headers, and dependency advisories. This is not an independent penetration test or GDPR compliance certification. Live database policies and provider settings were not inspected.

## Changes
- Added an in-app beta notice across all routes and public imprint, privacy, data-sharing, and security pages.
- Added frame denial, MIME sniffing protection, referrer policy, restricted browser permissions, and a limited CSP for framing, base URLs, embedded objects, and form targets. The CSP is not a complete script-execution/XSS policy.
- Marked private/auth responses no-store, preserved refreshed auth cookies on redirects, and restricted service-worker runtime caching to same-origin public assets. Activation removes previously cached private-route and external responses.

## Findings Still Requiring Attention
- **Account-data integrity:** legacy session actions trust client-provided correctness/XP, and profile ownership policies allow users to update their own scores. Scores must not be used for certification, rewards, or trusted rankings. Server-side scoring and replay-safe updates need separate implementation.
- **Session ownership:** the `session_events` ownership policy checks `user_id` but does not bind the supplied `session_id` to that same owner. Add parent-session ownership validation and an RLS constraint/policy before relying on session analytics as authoritative. This review did not test exploitability against live accounts.
- **Production isolation:** migration SQL contains user-ownership RLS, but applying those migrations and verifying isolation with two independent test accounts remain required. No live database changes were made.
- **Privacy readiness:** the operator supplied a public name, email, and locality on 2026-09-12. A full postal address, actual database region, email provider, processing agreements, international transfers, and retention/backup schedules remain unconfirmed. Legal pages remain visibly incomplete; the supplied email is available for contact independently of the postal-address confirmation.
- **Device storage:** local learning progress remains on logout and is readable by others using the same browser profile. Account export/deletion and a complete local-data clearing workflow are not implemented.
- **Abuse/operations:** verify Supabase email throttling, account protection, administrator MFA, backup recovery, and monitoring in the deployed services. Physical-device speech processing and real recovery delivery require end-to-end tests.

## Checks and Reproduction
- Verified locally: production build, TypeScript, scoped lint, all 7 focused security/legal browser tests, and the complete 62-test browser regression suite passed. Reviewed mobile practice and desktop legal screenshots; automated legal layout checks cover 320px and 1440px widths. These results do not verify deployed provider settings or authenticated cross-user isolation.
- Production dependency audit: `npm audit --omit=dev --audit-level=low` reported 0 known vulnerabilities at review time; this is not a guarantee of safety.
- No conventional credential files were found among tracked filenames. This was not a full Git-history secret scan; rotate any credentials previously exposed outside Git.
- Run from `app/`: `npm run build`, then `npm run test:e2e -- --grep "public legal|beta status|browser headers|service worker purges"`. Tests cover public pages, visible beta status, desktop/mobile widths, headers, redirect targets, and private cache cleanup.
- The prior learning suite covers 50 chapter playthroughs plus learning/auth regression checks. Speech and recovery-email delivery are mocked where noted; no production load or intrusive security tests are performed.

## Operator Setup
Public operator defaults can be overridden with `LEGAL_OPERATOR_NAME`, `LEGAL_OPERATOR_ADDRESS`, and `LEGAL_CONTACT_EMAIL` in the deployment environment. Supply a full appropriate postal address and set `LEGAL_OPERATOR_ADDRESS_CONFIRMED=true` only after verifying it, then rebuild. Do not confirm a town/postcode/country alone. These values are intentionally public website disclosures, not credentials. Keep private secrets out of source and chat. Configuration alone does not establish legal compliance; review all unverified policy statements and any additional German disclosure obligations before broader release.

The operator's pasted Groq settings showed both ZDR controls disabled and storage-dependent APIs enabled on 2026-09-12. Enable Global ZDR in a dedicated Sprechen organization, or Inference APIs ZDR when other applications still require Batch/LoRA storage. Verify the effective settings before allowing personal recordings; no live Groq settings have been changed or independently verified here.

## Personal Chapters Addendum (2026-09-12)
- Personal chapters add owner-restricted tables and private temporary audio, service-only quota reservations, bounded/validated AI requests, same-origin API writes, and a daily cleanup route. New parent-child tables bind both the chapter ID and owner, unlike the legacy session-ownership issue above.
- Local verification: 24 unit/isolated SQL tests and 70 production-build browser tests passed, with scoped lint and a zero-advisory production dependency audit. PGlite verifies migration/RLS behavior locally; it does not verify the deployed Supabase schema or Storage service.
- Generation and transcription in browser tests are mocked. A virtual Chromium microphone test verifies real WebM output duration and microphone cleanup, not ASR accuracy. Live Groq benchmarking was blocked because no key is configured; no provider calls were made.
- Personal chapter export/deletion is implemented, but full account export/deletion and local built-in-progress clearing remain open. Live processor settings, legal details, cleanup operation, physical-device audio, and German content quality remain release gates. Creation is disabled by default. See [PERSONAL-CHAPTERS.md](PERSONAL-CHAPTERS.md).