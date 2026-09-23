import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { checkAnswer } from "./answer-check.ts";
import { applyGrade, gradeFor, introduce } from "./memory.ts";
import { EMPTY_STATS, localDate, meetGoal, visibleStreak, weekStrip, xpFor } from "./activity.ts";
import { buildReviewStep, parseReviewStepId, planReview, reviewStepFor, reviewStepId, reviewTypeFor } from "./review.ts";
import { catalog, coursePath, findStep, getLesson, reviewSubject } from "./catalog.ts";
import { validateCourse } from "./validate.ts";
import { nextAction, placementToUnit } from "./next-action.ts";
import { A1_PATTERNS } from "../../content/a1/patterns.ts";
import { audioFile, stepSpeech } from "./speech-text.ts";
import type { Step } from "./types.ts";

const typed = (accepted: string[], extra: Partial<Step> = {}): Step => ({ id: "t", type: "type", itemKeys: ["x"], prompt: "", accepted, ...extra });

test("answer check accepts umlaut spellings and small typos but not wrong articles", () => {
  assert.equal(checkAnswer(typed(["Ich hätte gern einen Käse."]), "ich hätte gern einen käse").verdict, "correct");
  const folded = checkAnswer(typed(["Der Käse ist lecker."]), "Der Kaese ist lecker");
  assert.equal(folded.verdict, "close");
  assert.match(folded.feedback ?? "", /Käse/);
  assert.equal(checkAnswer(typed(["Ich suche Tomaten."]), "Ich suche Tomatn").verdict, "close");
  assert.equal(checkAnswer(typed(["Ich möchte einen Tee."]), "Ich möchte einem Tee").verdict, "wrong");
  assert.equal(checkAnswer(typed(["der Kaffee"], { critical: ["der"] }), "die Kaffee").verdict, "wrong");
  assert.equal(checkAnswer(typed(["Ich bin müde."]), "Ich bist müde").verdict, "wrong");
  assert.equal(checkAnswer(typed(["Hallo!", "Guten Tag!"]), "guten tag").verdict, "correct");
  assert.equal(checkAnswer(typed(["Wie geht es Ihnen?"]), "").verdict, "wrong");
});

test("speaking is lenient, choices are exact and explain mistakes", () => {
  assert.equal(checkAnswer(typed(["Können Sie das wiederholen?"], { type: "speak" }), "können sie das wieder holen").verdict, "correct");
  const choice: Step = { id: "c", type: "fill_gap", itemKeys: [], prompt: "", options: ["einen", "ein", "eine"], accepted: ["einen"], why: { ein: "Tee is masculine." } };
  assert.equal(checkAnswer(choice, "einen").verdict, "correct");
  const wrong = checkAnswer(choice, "ein");
  assert.equal(wrong.verdict, "wrong");
  assert.equal(wrong.feedback, "Tee is masculine.");
});

test("match and build steps are scored from the learner's moves", () => {
  const match: Step = { id: "m", type: "match", itemKeys: [], prompt: "", pairs: [["der Tee", "the tea"], ["das Brot", "the bread"]], accepted: [] };
  const perfect = JSON.stringify([["der Tee", "the tea"], ["das Brot", "the bread"]]);
  const oneSlip = JSON.stringify([["der Tee", "the bread"], ["der Tee", "the tea"], ["das Brot", "the bread"]]);
  assert.equal(checkAnswer(match, perfect).verdict, "correct");
  assert.equal(checkAnswer(match, oneSlip).verdict, "close");
  assert.equal(checkAnswer(match, JSON.stringify([["der Tee", "the tea"]])).verdict, "wrong");
  assert.equal(checkAnswer(match, "not json").verdict, "wrong");
  const build: Step = { id: "b", type: "build", itemKeys: [], prompt: "", tiles: ["Ich", "trinke", "Tee", "Brot"], accepted: ["Ich trinke Tee."] };
  assert.equal(checkAnswer(build, "Ich trinke Tee").verdict, "correct");
  const misordered = checkAnswer(build, "Tee trinke Ich");
  assert.equal(misordered.verdict, "wrong");
  assert.ok(misordered.diff?.some((token) => !token.ok));
});

test("memory: early practice never postpones, mistakes always bring items back", () => {
  const now = new Date("2026-09-01T10:00:00Z");
  const first = applyGrade(undefined, "w.tee", 4, now);
  assert.equal(first.intervalDays, 1);
  const again = applyGrade(first, "w.tee", 4, new Date("2026-09-01T10:05:00Z"));
  assert.equal(again.dueAt, first.dueAt);
  assert.equal(again.seen, 2);
  const slip = applyGrade(again, "w.tee", 1, new Date("2026-09-01T10:06:00Z"));
  assert.ok(Date.parse(slip.dueAt) < Date.parse(first.dueAt));
  assert.equal(slip.lapses, 1);
  const later = applyGrade(first, "w.tee", 4, new Date("2026-09-02T11:00:00Z"));
  assert.equal(later.intervalDays, 3);
  assert.ok(later.strength > first.strength);
  assert.equal(gradeFor("correct", "choose", false), 3);
  assert.equal(gradeFor("correct", "type", false), 4);
  assert.equal(gradeFor("correct", "type", true), 3);
  assert.equal(gradeFor("seen", "intro", false), null);
  assert.equal(introduce("w.tee", now).seen, 1);
});

test("streaks count goal days, freezes cover missed days, and freezes are earned weekly", () => {
  let stats = EMPTY_STATS;
  ({ stats } = meetGoal(stats, "2026-09-01"));
  ({ stats } = meetGoal(stats, "2026-09-02"));
  assert.equal(stats.current, 2);
  assert.equal(meetGoal(stats, "2026-09-02").stats, stats);
  assert.equal(meetGoal(stats, "2026-09-05").stats.current, 1);
  const frozen = meetGoal({ ...stats, freezes: 1 }, "2026-09-04");
  assert.equal(frozen.stats.current, 3);
  assert.deepEqual(frozen.frozenDates, ["2026-09-03"]);
  assert.equal(frozen.stats.freezes, 0);
  let week = EMPTY_STATS;
  for (let day = 1; day <= 7; day++) week = meetGoal(week, `2026-09-0${day}`).stats;
  assert.equal(week.freezes, 1);
  assert.equal(visibleStreak(week, "2026-09-08"), 7);
  assert.equal(visibleStreak(week, "2026-09-09"), 7);
  assert.equal(visibleStreak(week, "2026-09-10"), 0);
  assert.equal(xpFor("correct", false), 2);
  assert.equal(xpFor("correct", true), 1);
  assert.equal(xpFor("wrong", false), 0);
  assert.equal(localDate(new Date("2026-09-01T23:30:00Z"), "Europe/Berlin"), "2026-09-02");
  assert.equal(localDate(new Date("2026-09-01T23:30:00Z"), "Asia/Kolkata"), "2026-09-02");
  const strip = weekStrip([{ date: "2026-09-07", xp: 40, goalXp: 30, goalMet: true, freezeUsed: false }], "2026-09-08");
  assert.equal(strip.length, 7);
  assert.equal(strip[5].state, "met");
  assert.equal(strip[6].state, "today");
});

test("review planning uses only due items unless extra practice is requested", () => {
  const now = new Date("2026-09-10T10:00:00Z");
  const due = { ...applyGrade(undefined, "w.tee", 4, new Date("2026-09-01T10:00:00Z")) };
  const notDue = applyGrade(undefined, "w.kaffee", 4, new Date("2026-09-10T09:00:00Z"));
  assert.deepEqual(planReview([due, notDue], now).map((state) => state.key), ["w.tee"]);
  const stale = { ...notDue, lastSeenAt: "2026-09-09T00:00:00Z" };
  assert.deepEqual(planReview([due, stale], now, 12, true).map((state) => state.key), ["w.tee", "w.kaffee"]);
  const subject = reviewSubject("w.kaffee")!;
  assert.equal(reviewTypeFor(subject, undefined).type, "choose");
  assert.equal(reviewTypeFor(subject, { strength: 0.3, seen: 3 }).type, "article");
  assert.equal(reviewTypeFor(subject, { strength: 0.8, seen: 3 }).type, "type");
  const phrase = reviewSubject("p.die-rechnung-bitte")!;
  assert.equal(reviewTypeFor(phrase, { strength: 0.3, seen: 1 }).type, "build");
  assert.deepEqual(parseReviewStepId(reviewStepId("w.kaffee", "article", 0)), { key: "w.kaffee", type: "article", variant: 0 });
  const pattern = reviewStepFor(reviewSubject("g.akk-den")!, undefined);
  assert.equal(pattern.type, "fill_gap");
  assert.deepEqual(buildReviewStep(subject, "article"), findStep(reviewStepId("w.kaffee", "article")));
});

test("the whole A1 course passes the authoring rules", () => {
  const { units, lessons, missions } = catalog();
  const errors = validateCourse(units, A1_PATTERNS, [...lessons.values()], new Set(missions.keys()));
  assert.deepEqual(errors, []);
  assert.equal(units.length, 10);
  assert.ok(coursePath().length >= 50);
});

test("every lesson step can be rebuilt from its id for server-side scoring", () => {
  for (const lesson of catalog().lessons.values()) {
    for (const step of lesson.steps) assert.deepEqual(findStep(step.id), step, step.id);
  }
});

test("conversation lessons get real distractors instead of reversed answers", () => {
  const cafe = getLesson("conv.cafe")!;
  const build = cafe.steps.find((step) => step.type === "build")!;
  assert.ok(build.tiles!.length >= 4);
  const doctor = getLesson("conv.doctor")!.steps.find((step) => step.type === "build")!;
  const answer = doctor.accepted[0].split(" ");
  assert.ok(doctor.tiles!.length >= answer.length + 2);
  assert.notDeepEqual(doctor.tiles!.slice(0, answer.length), [...answer].reverse());
});

test("today's single next action follows placement, review pressure, then the course path", () => {
  const { units } = catalog();
  const path = coursePath();
  assert.equal(nextAction(path, units, { placed: false, startUnit: 1, lessons: {}, dueCount: 0 }).kind, "placement");
  assert.equal(nextAction(path, units, { placed: true, startUnit: 1, lessons: {}, dueCount: 20 }).kind, "review");
  const first = nextAction(path, units, { placed: true, startUnit: 1, lessons: {}, dueCount: 3 });
  assert.equal(first.kind, "lesson");
  assert.equal(first.kind === "lesson" && first.lesson.id, "a1-u01-l1");
  const resumed = nextAction(path, units, { placed: true, startUnit: 1, lessons: { "a1-u01-l1": { status: "completed", stepIndex: 0 }, "a1-u01-l2": { status: "started", stepIndex: 5 } }, dueCount: 0 });
  assert.ok(resumed.kind === "lesson" && resumed.resume && resumed.lesson.id === "a1-u01-l2");
  const skipped = nextAction(path, units, { placed: true, startUnit: 3, lessons: {}, dueCount: 0 });
  assert.equal(skipped.kind === "lesson" && skipped.lesson.id, "a1-u03-l1");
  assert.equal(placementToUnit("a1", 20), 1);
  assert.equal(placementToUnit("a1", 70), 3);
  assert.equal(placementToUnit("a2", 70), 6);
});

test("every German line in the course has a generated voice clip", () => {
  const missing = new Set<string>();
  for (const lesson of catalog().lessons.values()) for (const step of lesson.steps) for (const text of stepSpeech(step)) {
    if (!existsSync(new URL(`../../../public/audio/${audioFile(text)}`, import.meta.url))) missing.add(text);
  }
  assert.deepEqual([...missing].slice(0, 10), [], `${missing.size} lines have no clip. Run: npm run audio:manifest, then scripts/tts-build.py`);
});
