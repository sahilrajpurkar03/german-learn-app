import type { Mission, MissionTurn } from "../learning-content.ts";
import { pick, scramble } from "./random.ts";
import { tokens } from "./build-lesson.ts";
import type { Item, Lesson, Step } from "./types.ts";

export const conversationLessonId = (missionId: string) => `conv.${missionId}`;
export const turnItemKey = (missionId: string, index: number) => `t.${missionId}.${index}`;

const TEMPLATE_NOTE = /Other wording may also be valid; this exercise checks the model phrase\.$/;

function cleanNote(turn: MissionTurn): string | undefined {
  if (TEMPLATE_NOTE.test(turn.note)) return undefined;
  if (turn.kind === "listen" && turn.note === turn.translation) return undefined;
  return turn.note;
}

/** Every graded conversation response becomes a reviewable phrase. */
export function turnItem(mission: Mission, index: number): Item | null {
  const turn = mission.turns[index];
  if (!turn || turn.kind === "listen") return null;
  const de = turn.accepted[0].replace(/\s+/g, " ").trim();
  return { id: turnItemKey(mission.id, index), kind: "phrase", de: /[.!?]$/.test(de) ? de : `${de}${/^(Wie|Was|Wo|Wann|Warum|Können|Könnten|Kann|Darf|Haben|Gibt|Ist|Sind|Muss|Soll|Welche|Wer|Woher|Wohin)\b/.test(de) ? "?" : "."}`, en: turn.task.replace(/^(Say|Ask|Tell|Reply|Explain|Answer)[^:]*:\s*/i, ""), alt: turn.accepted.slice(1), note: cleanNote(turn) };
}

export function conversationStep(mission: Mission, index: number, distractorWords: string[]): Step {
  const turn = mission.turns[index];
  const id = `${conversationLessonId(mission.id)}~turn:${index}`;
  const speaker = { name: mission.partner, role: mission.role };
  const itemKeys = turn.kind === "listen" ? [] : [turnItemKey(mission.id, index)];
  const base = { id, itemKeys, prompt: turn.task, text: turn.line, audio: turn.line, translation: turn.translation, accepted: turn.accepted, note: cleanNote(turn), speaker };
  if (turn.kind === "listen") return { ...base, type: "listen_choose", options: turn.options };
  if (turn.kind === "choose") return { ...base, type: "choose", options: turn.options };
  if (turn.kind === "build") {
    const words = tokens(turn.accepted[0]);
    const lower = new Set(words.map((word) => word.toLocaleLowerCase("de")));
    const extras = pick([...new Set(distractorWords.filter((word) => !lower.has(word.toLocaleLowerCase("de")) && word.length > 2))], 2, id);
    return { ...base, type: "build", tiles: scramble([...words, ...extras], id) };
  }
  return { ...base, type: "respond" };
}

export function conversationLesson(mission: Mission, unitId: string): Lesson {
  const pool = mission.turns.flatMap((turn) => tokens(turn.line));
  const steps = mission.turns.map((_, index) => conversationStep(mission, index, pool));
  return {
    id: conversationLessonId(mission.id), unitId, kind: "conversation", title: mission.title, goal: mission.challenge ?? mission.subtitle,
    minutes: Math.max(3, mission.turns.length), steps, introduces: [],
  };
}
