# Continuing Practice

## Implemented Scope

- The studio now offers daily practice after any number of completed chapters. Chapter completion remains a separate historical record, not proof of retention.
- The planner combines due responses with up to two new responses when enough due work exists. It fills short sessions from other eligible responses; early rehearsal is optional and does not postpone an upcoming recall check on success.
- The 204 built-in chapter turns have response-level evidence. Eight authored new-context challenges unlock after an independent delayed recall of their prerequisite. They have their own evidence; success on the original does not grant success on the variation.
- SM-2 scheduling is reused. Supported responses receive grade 2 and return after one day. Unaided responses receive grade 4. A delayed recall requires the item to be due and at least 24 hours since its previous completed response. Immediate repetition does not increment delayed recall.
- A word-bank target becomes a typed/spoken reply in daily practice after delayed recall. Showing translations, listening transcripts, self-checking, or retrying removes independent credit for that response. A nonmatching free reply is not proof that the user's German was wrong.
- Progress shows recall checks due, responses needing support, and responses remembered across days. These describe observed exercises, not CEFR certification, comprehensive vocabulary knowledge, or a measured probability of forgetting.
- Chapter cards show turn counts, not fixed completion-time promises. Daily goals and other duration estimates remain approximate.

## Shared Experience and Storage

`/learn/session` uses the studio conversation player and the same articulated 2D character as chapter and daily practice. The character has separately animated body parts tied to playback, listening, and feedback states. It is not phoneme lip-sync or pronunciation assessment. Reduced-motion preferences disable movement.

`/preview?mode=review` provides four sample review formats without creating sessions or writing cloud history. The normal `/preview` can exercise the local adaptive loop without an account or AI calls.

Speech-to-text now displays interim recognition in the reply field. The mic starts in a pending state, shows listening only after the browser starts recognition, and preserves the transcript when Stop is pressed. Leaving the turn cancels recognition and ignores late results. Permission, input-device, network, and unsupported-browser failures have distinct messages. Browser speech recognition still depends on browser support, device permission, and the browser's speech service; an exposed API alone does not establish that the service works (including embedded browsers). No paid or server transcription fallback was added.

Mobile checks cover the five main views and conversation controls at 320px and 390px, plus landscape and desktop layouts. Narrow-screen reply actions stack, speech controls have 44px touch targets, navigation labels are centered, and the assessment action sits below its copy. Safe-area padding remains available for bottom navigation.

The follow-up mobile audit uses single-line labels (My day, Practice, Chapters, Phrases, Progress) in fixed icon/text rows while preserving full accessible navigation names. Checks cover label alignment and containment, all 50 chapter playthroughs at 320px, public/auth pages, assessment steps/report, listening-game boards/feedback/results, and personal creator modes/delete dialog. Auth pages now have explicit readable colors with at least 4.5:1 checked text contrast under light and dark browser preferences. The older direct account-progress page received matching contrast and wrapping fixes; its authenticated rendering was not live-tested.

The existing `sprechen-studio-v1:<userId>` record has defaulted recall and checkpoint fields, so old saved state is retained. It stores identifiers, aggregate counts, last-response state, and scheduling dates, not typed replies or recordings. `attempts` counts completed response observations, not every keystroke or retry. Daily rounds now preserve their target order, starting recall snapshot, next response, score, and completion. Each completed response and checkpoint save together. Resuming does not record that response again. Finished rounds remain visible until another round is explicitly started.

The review preview also saves its next response and completion locally, separately from real recall evidence and cloud history. Explicit replay resets only that preview checkpoint. Earlier preview completions from before this change cannot be recovered because they were never stored. Authenticated legacy cloud review sessions still use their existing server-created session and scheduling flow; they do not gain cross-device checkpoint synchronization in this change.

My day shows an actionable roadmap with daily-round progress, explored situations, tracked response counts, the current situation, and upcoming situations. An existing chapter draft takes priority; without a draft, opening a partially explored chapter continues at its first untracked response. Fully explored chapters remain replayable. Exploration means a recorded chapter completion or observations for all its responses, not mastery. The roadmap uses the built-in situation order; adaptive daily practice may draw from different situations according to recall need.

Built-in chapters, legacy cloud review responses, and personal-chapter responses contribute to this device-local summary. Legacy cloud due dates still come from Supabase, and personal phrase queues remain separately self-rated. They are not yet merged into one server-authoritative daily queue. Cloud review format selection favours an available format previously needing support on this device. Personal-chapter deletion clears its local recall entries when storage is writable; other devices are not synchronised.

No schema migration, AI activation, provider call, credential change, or production account modification is part of this release. Existing legacy scoring/server-action limitations in SECURITY-REVIEW.md remain; this change does not make scores tamper-proof or certify live cloud saves.

## Verification

- `npm test`: pure scheduling, early replay, support, transfer unlocking, review conversion, and existing unit/isolated database checks.
- `npm run build`: production webpack build and TypeScript.
- `npm run test:e2e`: chapter completion, adaptive sessions, persistence, supported answers, review preview formats, mobile/desktop rendering, actual browser CSS animation state, reduced motion, and existing security/personal-chapter regressions.
- Speech services and personal APIs are mocked in browser checks. Physical-device audio, actual authenticated legacy saves, and cross-device reconciliation are not established by those tests.
- Microphone regressions cover pending cancellation, interim text, Stop, permission/network/input/no-speech errors, retry, and leaving the turn. Unit checks exercise recognition cleanup and transcript retention.

## Next Stages

An ongoing scheduler is now implemented, but content is still finite. Broader authored scenario families, live-verified bounded AI expansion, a cloud-synchronised evidence model, and richer skill/transfer evaluation remain separate work. This release does not claim unlimited novel lessons, a completed A1-B1 curriculum, or a guaranteed number of months of learning.