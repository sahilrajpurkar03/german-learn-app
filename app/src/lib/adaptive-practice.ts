import { z } from "zod";
import { initialSrsState, schedule } from "./srs.ts";
import type { Mission, MissionTurn } from "./learning-content.ts";

export const evidenceSchema = z.object({
  attempts: z.number().int().nonnegative(),
  independent: z.number().int().nonnegative(),
  supported: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
  lastAt: z.string().datetime(),
  dueAt: z.string().datetime(),
  lastIndependent: z.boolean(),
  easeFactor: z.number().min(1.3),
  intervalDays: z.number().nonnegative(),
  repetitions: z.number().int().nonnegative(),
});
export type RecallEvidence = z.infer<typeof evidenceSchema>;
export type LearningRecord = Record<string, RecallEvidence>;
export type PracticeTarget = { id: string; mission: Mission; turn: MissionTurn; index: number; prerequisite?: string };

export function practiceTargets(missions: Mission[]): PracticeTarget[] {
  return missions.flatMap((mission) => mission.turns.map((turn, index) => ({ id: `${mission.id}:${index}`, mission, turn, index })));
}

export function recordRecall(previous: RecallEvidence | undefined, independent: boolean, now: Date): RecallEvidence {
  const due = !previous || new Date(previous.dueAt) <= now;
  const delayed = Boolean(previous && due && now.getTime() - new Date(previous.lastAt).getTime() >= 86400000);
  const next = schedule(previous ?? initialSrsState(), independent ? 4 : 2, now);
  return {
    attempts: (previous?.attempts ?? 0) + 1,
    independent: (previous?.independent ?? 0) + Number(independent),
    supported: (previous?.supported ?? 0) + Number(!independent),
    delayed: (previous?.delayed ?? 0) + Number(delayed && independent),
    lastAt: now.toISOString(),
    lastIndependent: independent,
    dueAt: previous && independent && !due ? previous.dueAt : next.dueAt.toISOString(),
    easeFactor: previous && independent && !due ? previous.easeFactor : next.easeFactor,
    intervalDays: previous && independent && !due ? previous.intervalDays : next.intervalDays,
    repetitions: previous && independent && !due ? previous.repetitions : next.repetitions,
  };
}

export function recallStatus(evidence: RecallEvidence | undefined, now: Date) {
  if (!evidence) return "Not practised";
  if (new Date(evidence.dueAt) <= now) return "Recall check due";
  if (!evidence.lastIndependent) return "Needs support";
  if (evidence.delayed >= 2) return "Remembered across days";
  return "Building recall";
}

export function planPractice(targets: PracticeTarget[], record: LearningRecord, now: Date, limit = 8): PracticeTarget[] {
  const eligible = targets.filter((target) => !target.prerequisite || record[target.prerequisite]?.delayed > 0 || record[target.id]);
  const due = eligible.filter((target) => record[target.id] && new Date(record[target.id].dueAt) <= now)
    .sort((left, right) => Date.parse(record[left.id].dueAt) - Date.parse(record[right.id].dueAt));
  const fresh = eligible.filter((target) => !record[target.id]).sort((left, right) => Number(Boolean(right.prerequisite)) - Number(Boolean(left.prerequisite)));
  const later = eligible.filter((target) => record[target.id] && new Date(record[target.id].dueAt) > now)
    .sort((left, right) => Number(record[left.id].lastIndependent) - Number(record[right.id].lastIndependent)
      || Date.parse(record[left.id].dueAt) - Date.parse(record[right.id].dueAt));
  const count = Math.max(1, Math.min(12, Math.floor(limit)));
  const dueCount = fresh.length ? Math.max(1, count - 2) : count;
  const selected = [...due.slice(0, dueCount), ...fresh.slice(0, count - Math.min(due.length, dueCount))];
  const selectedIds = new Set(selected.map((target) => target.id));
  return [...selected, ...due.filter((target) => !selectedIds.has(target.id)), ...later].slice(0, count);
}

export function recallTurn(target: PracticeTarget, evidence: RecallEvidence | undefined): MissionTurn {
  if (evidence?.delayed && target.turn.kind === "build") {
    return { ...target.turn, kind: "respond", words: undefined, options: undefined };
  }
  return target.turn;
}