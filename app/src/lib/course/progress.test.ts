import assert from "node:assert/strict";
import test from "node:test";
import { applyActivity, applyToMemory, clampTime, completionOutcome, scoreAttempts, type Attempt, type DayChange } from "./progress.ts";
import { EMPTY_STATS } from "./activity.ts";
import { catalog, findStep, getLesson } from "./catalog.ts";
import { mapLegacy } from "./legacy-import.ts";
import { reminderKind, reminderMessage } from "./reminders.ts";
import { customLesson, parseCustomItemKey, parseCustomLessonId } from "./custom.ts";
import { checkAnswer } from "./answer-check.ts";
import type { MemoryState } from "./memory.ts";

const lesson = getLesson("a1-u03-l1")!;
const now = new Date("2026-09-10T10:00:00Z");
const attempt = (stepId: string, answer: string, extra: Partial<Attempt> = {}): Attempt => ({
  attemptId: crypto.randomUUID(), runId: "11111111-1111-4111-8111-111111111111", lessonId: lesson.id, stepId, kind: "answer", answer, responseMs: 900, occurredAt: now.toISOString(), stepIndex: 1, ...extra,
});

test("the server scores answers itself and spots retries within a run", () => {
  const article = lesson.steps.find((step) => step.type === "article")!;
  const wrong = article.options!.find((option) => option !== article.accepted[0])!;
  const scored = scoreAttempts([attempt(article.id, wrong), attempt(article.id, article.accepted[0])], (id) => findStep(id), new Set());
  assert.deepEqual(scored.map((entry) => [entry.verdict, entry.retry, entry.xp]), [["wrong", false, 0], ["correct", true, 1]]);
  const foreign = scoreAttempts([attempt("a1-u01-l1~match", "[]")], (id) => findStep(id), new Set());
  assert.equal(foreign.length, 0, "a step from another lesson is ignored");
  assert.equal(scoreAttempts([attempt("made-up~step", "x")], (id) => findStep(id), new Set()).length, 0);
});

test("memory follows scored answers; intro cards only introduce", () => {
  const intro = lesson.steps.find((step) => step.type === "intro")!;
  const type = lesson.steps.find((step) => step.type === "type")!;
  const states = new Map<string, MemoryState>();
  const scored = scoreAttempts([attempt(intro.id, ""), attempt(type.id, type.accepted[0])], (id) => findStep(id), new Set());
  const changed = applyToMemory(states, scored, now);
  assert.ok(changed.some((state) => state.key === intro.itemKeys[0]));
  const typed = states.get(type.itemKeys[0])!;
  assert.equal(typed.repetitions, 1);
});

test("completion needs most of the lesson; checkpoints need 80% right first time", () => {
  const graded = lesson.steps.filter((step) => !["intro", "pattern"].includes(step.type));
  const allRight = graded.map((step) => ({ stepId: step.id, verdict: "correct" as const, retry: false }));
  assert.deepEqual(completionOutcome(lesson, lesson.id, allRight), { counted: true, passed: true, score: 1, bonus: 10 });
  assert.equal(completionOutcome(lesson, lesson.id, allRight.slice(0, 2)).counted, false);
  const checkpoint = getLesson("a1-u03-check")!;
  const half = checkpoint.steps.map((step, index) => ({ stepId: step.id, verdict: index % 2 ? "wrong" as const : "correct" as const, retry: false }));
  const outcome = completionOutcome(checkpoint, checkpoint.id, half);
  assert.equal(outcome.counted, true);
  assert.equal(outcome.passed, false);
  assert.equal(outcome.bonus, 0);
  assert.equal(completionOutcome(null, "review", allRight.slice(0, 5)).bonus, 5);
});

test("XP lands on the learner's local day and the goal extends the streak once", () => {
  const change: DayChange = { days: new Map(), stats: EMPTY_STATS, xpTotal: 0 };
  applyActivity(change, new Date("2026-09-10T22:30:00Z"), "Europe/Berlin", 30, 20, { graded: 10 });
  applyActivity(change, new Date("2026-09-10T22:40:00Z"), "Europe/Berlin", 30, 15, { graded: 7 });
  const day = change.days.get("2026-09-11")!;
  assert.equal(day.xp, 35);
  assert.equal(day.goalMet, true);
  assert.equal(change.stats.current, 1);
  applyActivity(change, new Date("2026-09-10T22:50:00Z"), "Europe/Berlin", 30, 10, {});
  assert.equal(change.stats.current, 1);
  assert.equal(change.xpTotal, 45);
  assert.equal(clampTime("2020-01-01T00:00:00Z", now).getTime(), now.getTime() - 48 * 3600000);
  assert.equal(clampTime("2099-01-01T00:00:00Z", now).getTime(), now.getTime());
});

test("legacy on-device progress maps onto conversation phrases once", () => {
  const { items } = catalog();
  const turnItems = [...items.values()].filter((item) => item.id.startsWith("t."));
  const mapped = mapLegacy({
    goal: 45,
    recall: { "cafe:0": { attempts: 3, independent: 2, lastAt: "2026-09-01T10:00:00Z", dueAt: "2026-09-04T10:00:00Z", easeFactor: 2.6, intervalDays: 3, repetitions: 2 }, "unknown:9": { attempts: 1, independent: 1, lastAt: "x", dueAt: "y", easeFactor: 2.5, intervalDays: 1, repetitions: 1 } },
    completed: { cafe: { at: "2026-09-01T10:00:00Z" } },
    phrases: [{ text: "Kann ich mit Karte bezahlen", due: "2026-09-05T00:00:00Z" }],
  }, (key) => items.get(key), turnItems, now);
  assert.deepEqual(mapped.items.map((state) => state.key).sort(), ["t.cafe.0", "t.cafe.4"]);
  assert.deepEqual(mapped.completedLessons.map((entry) => entry.lessonId), ["conv.cafe"]);
  assert.equal(mapped.goalXp, 80);
});

test("reminders: one nudge a day at the chosen hour, only while the goal is open; Sunday recap", () => {
  const base = { timezone: "Europe/Berlin", reminderHour: 19, todayXp: 10, goalXp: 30, streak: 4, lastSentOn: null, lastRecapOn: null };
  const wednesday19 = new Date("2026-09-09T17:05:00Z");
  assert.equal(reminderKind(base, wednesday19), "reminder");
  assert.equal(reminderKind({ ...base, todayXp: 30 }, wednesday19), null);
  assert.equal(reminderKind({ ...base, lastSentOn: "2026-09-09" }, wednesday19), null);
  assert.equal(reminderKind(base, new Date("2026-09-09T12:00:00Z")), null);
  assert.equal(reminderKind({ ...base, reminderHour: null }, wednesday19), null);
  assert.equal(reminderKind(base, new Date("2026-09-13T17:05:00Z")), "recap");
  assert.match(reminderMessage("reminder", base, { xp: 0, lessons: 0, words: 0 }).title, /4-day streak/);
  assert.match(reminderMessage("reminder", base, { xp: 0, lessons: 0, words: 0 }).body, /20 XP/);
});

test("custom lessons play through the same player; free replies are compared, not failed", () => {
  const chapterId = "12345678-1234-4234-8234-123456789012";
  const turn = { kind: "respond" as const, line: "Wie kann ich helfen?", translation: "How can I help?", task: "Say you need an appointment.", options: null, words: null, accepted: ["Ich brauche einen Termin."], note: "Termin = appointment." };
  const scenario = { title: "Call the practice", place: "Phone", role: "Receptionist", challenge: "Call for real.", turns: [turn, turn, turn, turn] };
  const blueprint = { title: "Doctor call", summary: "Booking", level: "a1" as const, register: "formal" as const, targets: [{ text: "einen Termin", meaning: "an appointment", kind: "phrase" as const, note: "n", sourceQuote: "einen Termin" }, { text: "brauche", meaning: "need", kind: "verb" as const, note: "n", sourceQuote: "brauche" }, { text: "helfen", meaning: "help", kind: "verb" as const, note: "n", sourceQuote: "helfen" }], original: scenario, variation: scenario };
  const played = customLesson(chapterId, blueprint, "original");
  assert.deepEqual(parseCustomLessonId(played.id), { chapterId, variant: "original" });
  assert.deepEqual(parseCustomItemKey(`c.${chapterId}.1`), { chapterId, index: 1 });
  assert.ok(played.steps[0].itemKeys.includes(`c.${chapterId}.0`));
  assert.equal(checkAnswer(played.steps[0], "Ich hätte gern einen Termin am Montag").verdict, "seen");
  assert.equal(checkAnswer(played.steps[0], "Ich brauche einen Termin").verdict, "correct");
});
