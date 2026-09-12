import { z } from "zod";
import type { Mission } from "./learning-content.ts";
import { normalizeAnswer } from "./learning-engine.ts";

export const PERSONAL_LIMITS = {
  transcriptCharacters: 3000,
  audioSeconds: 180,
  audioBytes: 10 * 1024 * 1024,
  dailyCreations: 2,
  dailyGlobalAttempts: 20,
} as const;

export const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/wav": "wav",
  "audio/x-wav": "wav", "audio/webm": "webm", "audio/ogg": "ogg", "audio/flac": "flac",
};

const text = (maximum: number) => z.string().trim().min(1).max(maximum);
export const chapterInputSchema = z.object({
  transcript: z.string().trim().min(30).max(PERSONAL_LIMITS.transcriptCharacters),
  focus: text(160),
  level: z.enum(["a1", "a2", "b1"]),
  register: z.enum(["formal", "informal"]),
  consent: z.literal(true),
}).strict();

const turnSchema = z.object({
  kind: z.enum(["choose", "listen", "build", "respond"]),
  line: text(240),
  translation: text(240),
  task: text(200),
  options: z.array(text(160)).min(2).max(4).nullable(),
  words: z.array(text(50)).min(2).max(18).nullable(),
  accepted: z.array(text(160)).min(1).max(3),
  note: text(260),
}).strict();

const scenarioSchema = z.object({
  title: text(80),
  place: text(60),
  role: text(50),
  challenge: text(200),
  turns: z.array(turnSchema).min(4).max(6),
}).strict();

export const chapterBlueprintSchema = z.object({
  title: text(80),
  summary: text(240),
  level: z.enum(["a1", "a2", "b1"]),
  register: z.enum(["formal", "informal"]),
  targets: z.array(z.object({
    text: text(120),
    meaning: text(180),
    kind: z.enum(["phrase", "verb", "word"]),
    note: text(220),
    sourceQuote: z.string().trim().min(5).max(180),
  }).strict()).min(3).max(6),
  original: scenarioSchema,
  variation: scenarioSchema,
}).strict();

export type ChapterInput = z.infer<typeof chapterInputSchema>;
export type ChapterBlueprint = z.infer<typeof chapterBlueprintSchema>;
export type ChapterVariant = "original" | "variation";

export const progressSchema = z.object({
  index: z.number().int().min(0).max(6),
  correct: z.number().int().min(0).max(6),
  completed: z.boolean(),
}).strict().refine((progress) => progress.correct <= progress.index);
export type ChapterProgress = z.infer<typeof progressSchema>;
export type PersonalChapter = {
  id: string;
  created_at: string;
  blueprint: ChapterBlueprint;
  progress: Partial<Record<ChapterVariant, ChapterProgress>>;
};

export function validateChapter(value: unknown, input: ChapterInput): ChapterBlueprint {
  const chapter = chapterBlueprintSchema.parse(value);
  if (chapter.level !== input.level || chapter.register !== input.register)
    throw new Error("The chapter does not match the requested level or register.");
  if (normalizeAnswer(chapter.original.title) === normalizeAnswer(chapter.variation.title))
    throw new Error("The variation needs a distinct situation.");
  if (new Set(chapter.targets.map((target) => normalizeAnswer(target.text))).size !== chapter.targets.length)
    throw new Error("Learning targets must be unique.");
  if (!chapter.targets.some((target) => target.kind === "verb") || !chapter.targets.some((target) => target.kind === "phrase"))
    throw new Error("The chapter must include a useful verb and a phrase.");
  for (const target of chapter.targets) {
    if (!normalizeAnswer(input.transcript).includes(normalizeAnswer(target.sourceQuote)))
      throw new Error("A learning target cites text absent from the reviewed transcript.");
  }
  for (const scenario of [chapter.original, chapter.variation]) {
    if (!scenario.turns.some((turn) => turn.kind === "listen") || !scenario.turns.some((turn) => turn.kind === "build") || !scenario.turns.some((turn) => turn.kind === "respond"))
      throw new Error("Each scenario needs listening, sentence building, and reply practice.");
    for (const turn of scenario.turns) {
      const answers = turn.accepted.map(normalizeAnswer);
      if (new Set(answers).size !== answers.length) throw new Error("Duplicate accepted answers.");
      if (turn.kind === "choose" || turn.kind === "listen") {
        if (!turn.options || turn.words !== null) throw new Error("Choices require options, not a word bank.");
        const options = turn.options.map(normalizeAnswer);
        if (new Set(options).size !== options.length || options.filter((option) => answers.includes(option)).length !== 1 || answers.some((answer) => !options.includes(answer)))
          throw new Error("A choice exercise must have exactly one correct option.");
      } else if (turn.kind === "build") {
        if (!turn.words || turn.options !== null) throw new Error("Sentence building requires a word bank.");
        const tokens = (value: string) => normalizeAnswer(value).split(" ").sort().join(" ");
        if (tokens(turn.words.join(" ")) !== tokens(turn.accepted[0]))
          throw new Error("The word bank cannot build the model answer.");
      } else if (turn.options !== null || turn.words !== null) {
        throw new Error("Reply practice must not include hidden choices.");
      }
    }
  }
  if (JSON.stringify(chapter.original.turns) === JSON.stringify(chapter.variation.turns))
    throw new Error("The variation must change the conversation.");
  return chapter;
}

export function personalMission(chapter: PersonalChapter, variant: ChapterVariant): Mission {
  const scenario = chapter.blueprint[variant];
  return {
    id: `${chapter.id}:${variant}`,
    title: scenario.title,
    subtitle: chapter.blueprint.summary,
    place: scenario.place,
    topic: "My chapters",
    challenge: scenario.challenge,
    image: "/images/personal-chapter.jpg",
    partner: "Mila",
    role: scenario.role,
    skill: "production",
    minutes: 6,
    turns: scenario.turns.map((turn) => ({
      ...turn,
      options: turn.options ?? undefined,
      words: turn.words ?? undefined,
    })),
  };
}