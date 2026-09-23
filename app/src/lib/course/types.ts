// Course model: Course → Level → Unit → Lesson → Step.
// Authored content (units, items, patterns, lesson specs) lives in src/content; steps are
// generated deterministically from it so the server can rebuild any step by its id.

export type Level = "a1" | "a2" | "b1";
export type Gender = "m" | "f" | "n";

/** A learnable thing. Ids are globally unique and double as memory keys:
 *  `w.` word, `p.` phrase, `g.` grammar pattern, `t.` conversation response, `c.` custom-lesson target. */
export type Item = {
  id: string;
  kind: "word" | "phrase";
  de: string;
  en: string;
  /** extra accepted German answers (e.g. without "bitte", alternative word order) */
  alt?: string[];
  gender?: Gender;
  plural?: string;
  emoji?: string;
  example?: { de: string; en: string };
  note?: string;
};

export type PatternDrill = {
  /** sentence with a single "___" gap */
  sentence: string;
  en: string;
  options: string[];
  answer: string;
  /** feedback for a specific wrong option */
  why?: Record<string, string>;
};

export type Pattern = {
  id: string;
  level: Level;
  title: string;
  rule: string;
  /** examples; **bold** marks the highlighted part */
  examples: { de: string; en: string }[];
  drills: PatternDrill[];
};

export type PracticeSentence = {
  de: string;
  en: string;
  alt?: string[];
  /** word to blank out when this sentence becomes a fill-the-gap step */
  gap?: string;
  distractors?: string[];
};
export type DialogueTurn = { line: string; lineEn: string; task: string; accepted: string[]; note?: string };

export type LessonSpec = {
  id: string;
  title: string;
  goal: string;
  newItems: string[];
  pattern?: string;
  sentences: PracticeSentence[];
  dialogue: DialogueTurn[];
};

export type Unit = {
  id: string;
  level: Level;
  order: number;
  title: string;
  titleDe: string;
  emoji: string;
  canDo: string[];
  partner: { name: string; role: string };
  items: Item[];
  lessons: LessonSpec[];
  /** legacy mission ids played as this unit's conversations */
  conversations: string[];
};

export type ExerciseType =
  | "intro"
  | "pattern"
  | "choose"
  | "listen_tap"
  | "listen_choose"
  | "article"
  | "match"
  | "build"
  | "fill_gap"
  | "type"
  | "dictation"
  | "speak"
  | "respond";

export const GRADED_TYPES: ReadonlySet<ExerciseType> = new Set([
  "choose", "listen_tap", "listen_choose", "article", "match", "build", "fill_gap", "type", "dictation", "speak", "respond",
]);
/** Recognition exercises earn at most "good" (grade 3) in the scheduler; recall earns 4. */
export const RECOGNITION_TYPES: ReadonlySet<ExerciseType> = new Set(["choose", "listen_tap", "listen_choose", "article", "match"]);

export type Step = {
  id: string;
  type: ExerciseType;
  itemKeys: string[];
  /** instruction shown above the exercise */
  prompt: string;
  /** main text: German for recognition, English for production */
  text?: string;
  /** German to speak aloud */
  audio?: string;
  translation?: string;
  options?: string[];
  tiles?: string[];
  pairs?: [de: string, en: string][];
  gap?: { before: string; after: string };
  accepted: string[];
  critical?: string[];
  why?: Record<string, string>;
  note?: string;
  speaker?: { name: string; role: string };
  /** free reply that is compared with a model answer instead of being marked wrong */
  selfCheck?: boolean;
  card?: {
    de: string;
    en: string;
    gender?: Gender;
    plural?: string;
    emoji?: string;
    example?: { de: string; en: string };
    note?: string;
  };
  patternCard?: { title: string; rule: string; examples: { de: string; en: string }[] };
};

export type LessonKind = "core" | "conversation" | "checkpoint";

export type Lesson = {
  id: string;
  unitId: string;
  kind: LessonKind;
  title: string;
  goal: string;
  minutes: number;
  steps: Step[];
  introduces: string[];
};

export type Verdict = "correct" | "close" | "wrong" | "seen";
