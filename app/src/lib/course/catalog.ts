import { MISSIONS } from "../learning-content.ts";
import type { Mission } from "../learning-content.ts";
import { A1_UNITS } from "../../content/a1/index.ts";
import { A1_PATTERNS } from "../../content/a1/patterns.ts";
import { buildCheckpoint, buildCoreLesson } from "./build-lesson.ts";
import { conversationLesson, conversationLessonId, turnItem } from "./conversations.ts";
import { parseReviewStepId, buildReviewStep, type ReviewSubject } from "./review.ts";
import type { Item, Lesson, Level, Pattern, Step, Unit } from "./types.ts";

export const LEVELS: { id: Level; title: string; available: boolean }[] = [
  { id: "a1", title: "A1 · Beginner", available: true },
  { id: "a2", title: "A2 · Elementary", available: false },
  { id: "b1", title: "B1 · Intermediate", available: false },
];

export type UnitOutline = { unit: Unit; lessons: Lesson[]; core: Lesson[]; conversations: Lesson[]; checkpoint: Lesson };

function assemble() {
  const units = [...A1_UNITS].sort((left, right) => left.order - right.order);
  const patterns: Record<string, Pattern> = Object.fromEntries(A1_PATTERNS.map((pattern) => [pattern.id, pattern]));
  const items = new Map<string, Item>();
  const itemUnit = new Map<string, string>();
  for (const unit of units) for (const item of unit.items) {
    items.set(item.id, item);
    itemUnit.set(item.id, unit.id);
  }
  const missions = new Map(MISSIONS.map((mission) => [mission.id, mission]));
  const missionUnit = new Map<string, string>();
  const lessons = new Map<string, Lesson>();
  const outlines: UnitOutline[] = [];
  const known: Item[] = [];
  const bank = units.flatMap((unit) => unit.items);
  for (const unit of units) {
    const core = unit.lessons.map((spec) => {
      const lesson = buildCoreLesson(unit, spec, (id) => items.get(id), patterns, [...known], bank);
      for (const id of spec.newItems) known.push(items.get(id)!);
      return lesson;
    });
    const conversations = unit.conversations.map((id) => missions.get(id)).filter((mission): mission is Mission => Boolean(mission)).map((mission) => {
      missionUnit.set(mission.id, unit.id);
      return conversationLesson(mission, unit.id, bank);
    });
    const checkpoint = buildCheckpoint(unit, patterns, bank);
    const all = [...core, ...conversations, checkpoint];
    for (const lesson of all) lessons.set(lesson.id, lesson);
    outlines.push({ unit, lessons: all, core, conversations, checkpoint });
  }
  // Situations not yet placed in a unit stay playable as extra conversations of the closest unit.
  for (const mission of MISSIONS) {
    if (missionUnit.has(mission.id)) continue;
    const unitId = units.at(-1)!.id;
    missionUnit.set(mission.id, unitId);
    lessons.set(conversationLessonId(mission.id), conversationLesson(mission, unitId, bank));
  }
  for (const mission of MISSIONS) mission.turns.forEach((_, index) => {
    const item = turnItem(mission, index);
    if (item) { items.set(item.id, item); itemUnit.set(item.id, `conv:${mission.id}`); }
  });
  return { units, patterns, items, itemUnit, missions, missionUnit, lessons, outlines, bank };
}

let cached: ReturnType<typeof assemble> | null = null;
export function catalog() {
  cached ??= assemble();
  return cached;
}

export function getLesson(id: string): Lesson | undefined {
  return catalog().lessons.get(id);
}

export function getOutline(unitId: string): UnitOutline | undefined {
  return catalog().outlines.find((outline) => outline.unit.id === unitId);
}

/** Lessons in the order a learner should take them: core lessons, then the unit's first conversation, then the checkpoint. */
export function coursePath(): Lesson[] {
  return catalog().outlines.flatMap((outline) => [...outline.core, ...outline.conversations.slice(0, 1), outline.checkpoint]);
}

export function getItem(key: string): Item | undefined {
  return catalog().items.get(key);
}

export function getPattern(key: string): Pattern | undefined {
  return catalog().patterns[key];
}

/** Items that make good distractors for `key`: the rest of its unit or conversation. */
export function itemPool(key: string): Item[] {
  const { items, itemUnit, outlines, missions } = catalog();
  const home = itemUnit.get(key);
  if (!home) return [];
  if (home.startsWith("conv:")) {
    const mission = missions.get(home.slice(5));
    const own = mission ? mission.turns.map((_, index) => turnItem(mission, index)).filter((item): item is Item => Boolean(item)) : [];
    if (own.length >= 3) return own;
    const neighbours = [...missions.values()].filter((other) => other.id !== mission?.id && (other.topic ?? "") === (mission?.topic ?? "")).slice(0, 3);
    return [...own, ...neighbours.flatMap((other) => other.turns.map((_, index) => turnItem(other, index)).filter((item): item is Item => Boolean(item)))];
  }
  // Course words and phrases: wrong options come from the whole course, not just one unit.
  return outlines.some((outline) => outline.unit.id === home) ? catalog().bank : [...items.values()].slice(0, 10);
}

export function reviewSubject(key: string, custom?: (key: string) => { item: Item; pool: Item[] } | null): ReviewSubject | null {
  const pattern = getPattern(key);
  if (pattern) return { kind: "pattern", pattern };
  const item = getItem(key);
  if (item) return { kind: "item", item, pool: itemPool(key) };
  const external = custom?.(key);
  return external ? { kind: "item", ...external } : null;
}

export type ExternalContent = {
  item?: (key: string) => { item: Item; pool: Item[] } | null;
  lesson?: (lessonId: string) => Lesson | undefined;
};

/** Rebuild the exact step a learner saw from its id. Used by the server to score answers. */
export function findStep(stepId: string, external?: ExternalContent): Step | null {
  const review = parseReviewStepId(stepId);
  if (review) {
    const subject = reviewSubject(review.key, external?.item);
    return subject ? buildReviewStep(subject, review.type, review.variant) : null;
  }
  const lessonId = stepId.split("~")[0];
  const lesson = getLesson(lessonId) ?? external?.lesson?.(lessonId);
  return lesson?.steps.find((step) => step.id === stepId) ?? null;
}

export function unitOfLesson(lessonId: string): Unit | undefined {
  const lesson = getLesson(lessonId);
  return lesson ? catalog().units.find((unit) => unit.id === lesson.unitId) : undefined;
}
