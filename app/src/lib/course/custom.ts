import type { ChapterBlueprint, ChapterVariant } from "../personal-chapters.ts";
import { pick, scramble } from "./random.ts";
import { tokens } from "./build-lesson.ts";
import type { Item, Lesson, Step } from "./types.ts";

// Personal (AI-generated) chapters played through the same player as the course.
// Lesson id: custom.<chapterId>.<variant>; target memory keys: c.<chapterId>.<targetIndex>.

export const customLessonId = (chapterId: string, variant: ChapterVariant) => `custom.${chapterId}.${variant}`;
export const customItemKey = (chapterId: string, index: number) => `c.${chapterId}.${index}`;

export function parseCustomLessonId(id: string): { chapterId: string; variant: ChapterVariant } | null {
  const match = /^custom\.([0-9a-f-]{36})\.(original|variation)$/.exec(id);
  return match ? { chapterId: match[1], variant: match[2] as ChapterVariant } : null;
}

export function parseCustomItemKey(key: string): { chapterId: string; index: number } | null {
  const match = /^c\.([0-9a-f-]{36})\.(\d)$/.exec(key);
  return match ? { chapterId: match[1], index: Number(match[2]) } : null;
}

export function customItems(chapterId: string, blueprint: ChapterBlueprint): Item[] {
  return blueprint.targets.map((target, index) => ({ id: customItemKey(chapterId, index), kind: "phrase", de: target.text, en: target.meaning, note: target.note }));
}

export function customLesson(chapterId: string, blueprint: ChapterBlueprint, variant: ChapterVariant): Lesson {
  const scenario = blueprint[variant];
  const id = customLessonId(chapterId, variant);
  const targets = customItems(chapterId, blueprint);
  const pool = scenario.turns.flatMap((turn) => tokens(turn.line));
  const steps: Step[] = scenario.turns.map((turn, index) => {
    const stepId = `${id}~turn:${index}`;
    const answer = turn.accepted[0].toLocaleLowerCase("de");
    const itemKeys = targets.filter((target) => answer.includes(target.de.toLocaleLowerCase("de").replace(/[.!?]$/, ""))).map((target) => target.id);
    const base = { id: stepId, itemKeys, prompt: turn.task, text: turn.line, audio: turn.line, translation: turn.translation, accepted: turn.accepted, note: turn.note, speaker: { name: "Partner", role: scenario.role } };
    if (turn.kind === "listen") return { ...base, type: "listen_choose", options: turn.options ?? undefined, itemKeys: [] };
    if (turn.kind === "choose") return { ...base, type: "choose", options: turn.options ?? undefined };
    if (turn.kind === "build") {
      const words = turn.words ?? tokens(turn.accepted[0]);
      const lower = new Set(words.map((word) => word.toLocaleLowerCase("de")));
      const extras = pick([...new Set(pool.filter((word) => !lower.has(word.toLocaleLowerCase("de")) && word.length > 2))], 2, stepId);
      return { ...base, type: "build", tiles: scramble([...words, ...extras], stepId) };
    }
    // Free replies to AI-written prompts are compared, not strictly graded: many answers are valid.
    return { ...base, type: "respond", selfCheck: true };
  });
  return { id, unitId: "custom", kind: "conversation", title: scenario.title, goal: scenario.challenge, minutes: Math.max(3, steps.length), steps, introduces: [] };
}
