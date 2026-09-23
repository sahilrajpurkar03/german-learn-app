import { pick, scramble, seededShuffle } from "./random.ts";
import type { Item, Lesson, LessonSpec, Pattern, PatternDrill, PracticeSentence, Step, Unit } from "./types.ts";

const ARTICLES: Record<string, string> = { m: "der", f: "die", n: "das" };

export function bareWord(item: Pick<Item, "de" | "gender">): string {
  return item.gender ? item.de.replace(/^(der|die|das)\s+/i, "") : item.de;
}

export function tokens(sentence: string): string[] {
  return sentence.replace(/[.,!?;:„“"]/g, " ").split(/\s+/).filter(Boolean);
}

function card(item: Item): Step["card"] {
  return { de: item.de, en: item.en, gender: item.gender, plural: item.plural, emoji: item.emoji, example: item.example, note: item.note };
}

function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

export function introStep(id: string, item: Item): Step {
  return { id, type: "intro", itemKeys: [item.id], prompt: item.kind === "phrase" ? "New phrase" : "New word", text: item.de, audio: item.de, translation: item.en, card: card(item), accepted: [] };
}

export function chooseMeaning(id: string, item: Item, pool: Item[]): Step {
  const wrong = pick(distinct(pool.filter((other) => other.id !== item.id && other.en !== item.en).map((other) => other.en)), 2, id);
  return { id, type: "choose", itemKeys: [item.id], prompt: "What does this mean?", text: item.de, audio: item.de, options: seededShuffle([item.en, ...wrong], `${id}:o`), accepted: [item.en] };
}

export function listenTap(id: string, item: Item, pool: Item[]): Step {
  const wrong = pick(distinct(pool.filter((other) => other.id !== item.id && other.de !== item.de && other.kind === item.kind).map((other) => other.de)), 2, id);
  const fallback = wrong.length < 2 ? pick(distinct(pool.filter((other) => other.id !== item.id && other.de !== item.de).map((other) => other.de)), 2 - wrong.length, `${id}:f`) : [];
  return { id, type: "listen_tap", itemKeys: [item.id], prompt: "Tap what you hear", audio: item.de, translation: item.en, options: seededShuffle([item.de, ...wrong, ...fallback], `${id}:o`), accepted: [item.de] };
}

export function articleStep(id: string, item: Item): Step | null {
  if (!item.gender) return null;
  const answer = ARTICLES[item.gender];
  return {
    id, type: "article", itemKeys: [item.id], prompt: "der, die or das?", text: bareWord(item), audio: item.de, translation: item.en,
    options: ["der", "die", "das"], accepted: [answer],
    why: Object.fromEntries(["der", "die", "das"].filter((option) => option !== answer).map((option) => [option, `It's ${item.de}. Learn nouns together with their article.`])),
  };
}

export function matchStep(id: string, items: Item[]): Step {
  const chosen = items.slice(0, 5);
  return { id, type: "match", itemKeys: chosen.map((item) => item.id), prompt: "Match the pairs", pairs: chosen.map((item) => [item.de, item.en]), accepted: [] };
}

export function typeStep(id: string, item: Pick<Item, "de" | "en" | "alt" | "gender"> & { id: string }, prompt = "Write this in German"): Step {
  return { id, type: "type", itemKeys: [item.id], prompt, text: item.en, audio: item.de, accepted: [item.de, ...(item.alt ?? [])], critical: item.gender ? [ARTICLES[item.gender]] : undefined, note: item.gender ? "Nouns are learned with their article." : undefined };
}

export function dictationStep(id: string, item: Pick<Item, "de" | "en" | "alt"> & { id: string }): Step {
  return { id, type: "dictation", itemKeys: [item.id], prompt: "Type what you hear", audio: item.de, translation: item.en, accepted: [item.de, ...(item.alt ?? [])] };
}

export function speakStep(id: string, item: Pick<Item, "de" | "en" | "alt"> & { id: string }): Step {
  return { id, type: "speak", itemKeys: [item.id], prompt: "Say this in German", text: item.en, audio: item.de, accepted: [item.de, ...(item.alt ?? [])], note: "Speech recognition checks the words, not your pronunciation." };
}

export function buildStep(id: string, sentence: PracticeSentence, itemKeys: string[], distractorPool: string[]): Step {
  const words = tokens(sentence.de);
  const lower = new Set(words.map((word) => word.toLocaleLowerCase("de")));
  const extras = pick(distinct(distractorPool.filter((word) => !lower.has(word.toLocaleLowerCase("de")) && word.length > 1)), 2, `${id}:d`);
  return { id, type: "build", itemKeys, prompt: "Build the sentence", text: sentence.en, audio: sentence.de, tiles: scramble([...words, ...extras], id), accepted: [sentence.de, ...(sentence.alt ?? [])] };
}

export function gapStep(id: string, sentence: PracticeSentence, itemKeys: string[], candidates: string[], distractorPool: string[]): Step | null {
  const words = tokens(sentence.de);
  const lowerCandidates = candidates.map((word) => word.toLocaleLowerCase("de"));
  const gap = sentence.gap ?? words.find((word) => lowerCandidates.includes(word.toLocaleLowerCase("de"))) ?? [...words].sort((left, right) => right.length - left.length)[0];
  if (!gap) return null;
  const position = sentence.de.indexOf(gap);
  if (position < 0) return null;
  const wrong = sentence.distractors ?? pick(distinct(distractorPool.filter((word) => word.toLocaleLowerCase("de") !== gap.toLocaleLowerCase("de") && word.length > 1)), 2, `${id}:d`);
  return {
    id, type: "fill_gap", itemKeys, prompt: "Fill the gap", text: sentence.en, audio: sentence.de, translation: sentence.en,
    gap: { before: sentence.de.slice(0, position), after: sentence.de.slice(position + gap.length) },
    options: seededShuffle([gap, ...wrong.slice(0, 2)], `${id}:o`), accepted: [gap],
  };
}

export function drillStep(id: string, pattern: Pattern, drill: PatternDrill): Step {
  const position = drill.sentence.indexOf("___");
  return {
    id, type: "fill_gap", itemKeys: [pattern.id], prompt: pattern.title, text: drill.en, translation: drill.en,
    audio: drill.sentence.replace("___", drill.answer),
    gap: { before: drill.sentence.slice(0, position), after: drill.sentence.slice(position + 3) },
    options: seededShuffle(drill.options, `${id}:o`), accepted: [drill.answer], why: drill.why, note: pattern.rule,
  };
}

export function patternCard(id: string, pattern: Pattern): Step {
  return { id, type: "pattern", itemKeys: [pattern.id], prompt: "Grammar in a nutshell", text: pattern.title, patternCard: { title: pattern.title, rule: pattern.rule, examples: pattern.examples }, accepted: [] };
}

function sentenceItems(sentence: PracticeSentence, items: Item[]): string[] {
  const words = new Set(tokens(sentence.de).map((word) => word.toLocaleLowerCase("de")));
  const matched = items.filter((item) => tokens(bareWord(item)).every((word) => words.has(word.toLocaleLowerCase("de"))));
  return matched.map((item) => item.id);
}

/** `known` = every item introduced before this lesson, across all earlier units and lessons. */
export function buildCoreLesson(unit: Unit, spec: LessonSpec, lookup: (id: string) => Item | undefined, patterns: Record<string, Pattern>, known: Item[] = []): Lesson {
  const key = (slug: string) => `${spec.id}~${slug}`;
  const items = spec.newItems.map((id) => {
    const item = lookup(id);
    if (!item) throw new Error(`Lesson ${spec.id} references unknown item ${id}`);
    return item;
  });
  const seenInUnit = [...known.filter((item) => unit.items.includes(item)), ...items];
  const pool = seenInUnit.length >= 6 ? seenInUnit : [...seenInUnit, ...unit.items.filter((item) => !seenInUnit.includes(item))].slice(0, 8);
  const linkable = [...known, ...items];
  const unitWords = distinct(unit.items.flatMap((item) => tokens(bareWord(item))));
  const steps: Step[] = [];

  items.forEach((item, index) => {
    steps.push(introStep(key(`intro:${item.id}`), item));
    if (index % 2 === 1) {
      const previous = items[index - 1];
      steps.push(listenTap(key(`hear:${previous.id}`), previous, pool));
      steps.push(chooseMeaning(key(`meaning:${item.id}`), item, pool));
    }
  });
  if (items.length % 2 === 1) steps.push(chooseMeaning(key(`meaning:${items.at(-1)!.id}`), items.at(-1)!, pool));
  if (items.length >= 3) steps.push(matchStep(key("match"), items));

  const pattern = spec.pattern ? patterns[spec.pattern] : undefined;
  if (spec.pattern && !pattern) throw new Error(`Lesson ${spec.id} references unknown pattern ${spec.pattern}`);
  if (pattern) {
    steps.push(patternCard(key(`pattern:${pattern.id}`), pattern));
    pattern.drills.slice(0, 2).forEach((drill, index) => steps.push(drillStep(key(`drill:${pattern.id}:${index}`), pattern, drill)));
  }

  const noun = items.find((item) => item.gender);
  const article = noun && articleStep(key(`article:${noun.id}`), noun);
  if (article) steps.push(article);

  spec.sentences.forEach((sentence, index) => {
    const linked = sentenceItems(sentence, linkable);
    const itemKeys = linked.length ? linked : items.slice(0, 1).map((item) => item.id);
    const slug = `sentence:${index}`;
    if (index % 3 === 0) steps.push(buildStep(key(slug), sentence, itemKeys, unitWords));
    else if (index % 3 === 1) {
      const gap = gapStep(key(slug), sentence, itemKeys, items.map(bareWord), unitWords);
      if (gap) steps.push(gap);
    } else steps.push({ ...typeStep(key(slug), { id: itemKeys[0], de: sentence.de, en: sentence.en, alt: sentence.alt }), itemKeys });
  });

  const recall = items.find((item) => item.kind === "word" && item !== noun) ?? items[0];
  steps.push(typeStep(key(`recall:${recall.id}`), recall));

  spec.dialogue.forEach((turn, index) => {
    const linked = sentenceItems({ de: turn.accepted[0], en: turn.task }, linkable);
    steps.push({
      id: key(`dialogue:${index}`), type: "respond", itemKeys: linked.length ? linked : [items[0].id], prompt: turn.task,
      text: turn.line, audio: turn.line, translation: turn.lineEn, accepted: turn.accepted, note: turn.note, speaker: unit.partner,
    });
  });

  return { id: spec.id, unitId: unit.id, kind: "core", title: spec.title, goal: spec.goal, minutes: Math.max(4, Math.round(steps.length * 0.45)), steps, introduces: items.map((item) => item.id) };
}

export function buildCheckpoint(unit: Unit, patterns: Record<string, Pattern>): Lesson {
  const id = `${unit.id}-check`;
  const key = (slug: string) => `${id}~${slug}`;
  const items = unit.items;
  const unitWords = distinct(items.flatMap((item) => tokens(bareWord(item))));
  const chosen = pick(items, Math.min(8, items.length), id);
  const steps: Step[] = [];
  chosen.forEach((item, index) => {
    const slug = `${index}:${item.id}`;
    if (index % 4 === 0) steps.push(listenTap(key(`hear:${slug}`), item, items));
    else if (index % 4 === 1) steps.push(chooseMeaning(key(`meaning:${slug}`), item, items));
    else if (index % 4 === 2) steps.push(articleStep(key(`article:${slug}`), item) ?? typeStep(key(`type:${slug}`), item));
    else steps.push(typeStep(key(`type:${slug}`), item));
  });
  const sentences = unit.lessons.flatMap((lesson) => lesson.sentences);
  pick(sentences, 2, `${id}:s`).forEach((sentence, index) => {
    const linked = sentenceItems(sentence, items);
    steps.push(buildStep(key(`build:${index}`), sentence, linked.length ? linked : [items[0].id], unitWords));
  });
  const unitPatterns = unit.lessons.map((lesson) => lesson.pattern).filter((value): value is string => Boolean(value)).map((patternId) => patterns[patternId]).filter(Boolean);
  unitPatterns.slice(0, 2).forEach((pattern) => {
    const drill = pattern.drills[pattern.drills.length - 1];
    steps.push(drillStep(key(`drill:${pattern.id}`), pattern, drill));
  });
  const final = unit.lessons.at(-1)?.dialogue[0];
  if (final) steps.push({ id: key("dialogue"), type: "respond", itemKeys: [items[0].id], prompt: final.task, text: final.line, audio: final.line, translation: final.lineEn, accepted: final.accepted, speaker: unit.partner });
  return { id, unitId: unit.id, kind: "checkpoint", title: `Checkpoint: ${unit.title}`, goal: "Show what you can do without help. Pass with 80% to complete the unit.", minutes: 6, steps, introduces: [] };
}

export const CHECKPOINT_PASS = 0.8;
