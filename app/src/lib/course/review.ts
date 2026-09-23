import { articleStep, buildStep, chooseMeaning, dictationStep, drillStep, gapStep, listenTap, speakStep, tokens, typeStep, bareWord } from "./build-lesson.ts";
import type { MemoryState } from "./memory.ts";
import type { ExerciseType, Item, Pattern, Step } from "./types.ts";

export type ReviewSubject =
  | { kind: "item"; item: Item; pool: Item[] }
  | { kind: "pattern"; pattern: Pattern };

export const REVIEW_SESSION_SIZE = 12;

export function reviewStepId(key: string, type: ExerciseType, variant = 0): string {
  return `R~${key}~${type}~${variant}`;
}

export function parseReviewStepId(id: string): { key: string; type: ExerciseType; variant: number } | null {
  const match = /^R~(.+)~([a-z_]+)~(\d+)$/.exec(id);
  return match ? { key: match[1], type: match[2] as ExerciseType, variant: Number(match[3]) } : null;
}

export function stageOf(strength: number): 0 | 1 | 2 {
  return strength < 0.2 ? 0 : strength < 0.5 ? 1 : 2;
}

/** Which exercise to use for an item, getting harder as memory strengthens. */
export function reviewTypeFor(subject: ReviewSubject, state: Pick<MemoryState, "strength" | "seen"> | undefined): { type: ExerciseType; variant: number } {
  if (subject.kind === "pattern") return { type: "fill_gap", variant: (state?.seen ?? 0) % Math.max(1, subject.pattern.drills.length) };
  const { item } = subject;
  const stage = stageOf(state?.strength ?? 0);
  const turn = (state?.seen ?? 0) % 3;
  if (stage === 0) return { type: turn === 1 && item.kind === "word" ? "listen_tap" : "choose", variant: 0 };
  if (stage === 1) {
    if (item.kind === "phrase") return { type: "build", variant: 0 };
    if (item.gender && turn !== 2) return { type: "article", variant: 0 };
    return { type: item.example ? "fill_gap" : "listen_tap", variant: 0 };
  }
  if (item.kind === "phrase") return { type: turn === 0 ? "type" : turn === 1 ? "speak" : "dictation", variant: 0 };
  return { type: turn === 2 ? "dictation" : "type", variant: 0 };
}

export function buildReviewStep(subject: ReviewSubject, type: ExerciseType, variant = 0): Step | null {
  if (subject.kind === "pattern") {
    const drill = subject.pattern.drills[variant % Math.max(1, subject.pattern.drills.length)];
    return drill && type === "fill_gap" ? drillStep(reviewStepId(subject.pattern.id, type, variant), subject.pattern, drill) : null;
  }
  const { item, pool } = subject;
  const id = reviewStepId(item.id, type, variant);
  switch (type) {
    case "choose": return chooseMeaning(id, item, pool);
    case "listen_tap": return listenTap(id, item, pool);
    case "article": return articleStep(id, item);
    case "type": return typeStep(id, item);
    case "dictation": return dictationStep(id, item);
    case "speak": return speakStep(id, item);
    case "build": return buildStep(id, { de: item.de, en: item.en, alt: item.alt }, [item.id], pool.flatMap((other) => tokens(bareWord(other))));
    case "fill_gap": {
      if (!item.example) return null;
      return gapStep(id, { de: item.example.de, en: item.example.en }, [item.id], tokens(bareWord(item)), pool.flatMap((other) => tokens(bareWord(other))));
    }
    default: return null;
  }
}

export function reviewStepFor(subject: ReviewSubject, state: MemoryState | undefined): Step {
  const { type, variant } = reviewTypeFor(subject, state);
  const step = buildReviewStep(subject, type, variant);
  if (step) return step;
  if (subject.kind === "pattern") return buildReviewStep(subject, "fill_gap", 0)!;
  return buildReviewStep(subject, "choose", 0)!;
}

/** Due items first (oldest first), then items that keep slipping. Never pads with items that are not due unless asked. */
export function planReview(states: MemoryState[], now: Date, limit = REVIEW_SESSION_SIZE, extra = false): MemoryState[] {
  const due = states.filter((state) => new Date(state.dueAt) <= now).sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt) || right.lapses - left.lapses);
  if (!extra || due.length >= limit) return due.slice(0, limit);
  const recent = now.getTime() - 6 * 3600000;
  const weakest = states
    .filter((state) => new Date(state.dueAt) > now && Date.parse(state.lastSeenAt) < recent)
    .sort((left, right) => left.strength - right.strength || right.lapses - left.lapses);
  return [...due, ...weakest].slice(0, limit);
}
