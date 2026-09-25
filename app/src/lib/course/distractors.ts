import { editDistance, foldUmlauts } from "./answer-check.ts";
import { pick, seededShuffle } from "./random.ts";
import type { Item } from "./types.ts";

// Wrong options that make the learner actually recognise the answer:
//  - same kind of thing (noun ↔ noun, verb ↔ verb, phrase ↔ phrase of similar length),
//  - looking or sounding alike for listening, close in meaning or form for reading,
//  - never the answers of the other questions in the same lesson (those are excluded by the caller).

export type ItemClass = "noun" | "verb" | "number" | "phrase" | "word";

const NUMBERS = new Set(["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "zwanzig", "dreißig", "hundert"]);

export function classify(item: Pick<Item, "kind" | "de" | "en" | "gender">): ItemClass {
  if (item.kind === "phrase") return "phrase";
  if (item.gender) return "noun";
  if (NUMBERS.has(item.de.toLocaleLowerCase("de"))) return "number";
  // The English gloss is the reliable signal: "morgen" (tomorrow) ends in -en but is not a verb.
  if (/^to /.test(item.en) && /^[a-zäöüß]+(en|ern|eln|n)$/.test(item.de)) return "verb";
  return "word";
}

function bare(item: Pick<Item, "de" | "gender">): string {
  return (item.gender ? item.de.replace(/^(der|die|das)\s+/i, "") : item.de).toLocaleLowerCase("de").replace(/[.!?,…]/g, "").trim();
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** 0 = identical … 1 = nothing alike: spelling and sound (umlauts folded). */
function formDistance(left: string, right: string): number {
  const a = foldUmlauts(left);
  const b = foldUmlauts(right);
  return editDistance(a, b) / Math.max(a.length, b.length, 1);
}

const ending = (text: string) => (/[?]$/.test(text) ? "?" : /[!]$/.test(text) ? "!" : /[.…]$/.test(text) ? "." : "");

/** Items authored next to each other (same unit) share a topic: prefer them as neighbours. */
function sameTopic(item: Item, other: Item, bank: Item[]): boolean {
  const unitSize = 20;
  return Math.floor(bank.indexOf(item) / unitSize) === Math.floor(bank.indexOf(other) / unitSize);
}

function candidates(item: Item, bank: Item[], exclude: Set<string>): Item[] {
  const kind = classify(item);
  const others = bank.filter((other) => other.id !== item.id && !exclude.has(other.id) && other.de !== item.de && other.en !== item.en);
  const same = others.filter((other) => classify(other) === kind);
  return same.length >= 2 ? same : others.filter((other) => other.kind === item.kind);
}

function best<T>(values: T[], score: (value: T) => number, count: number, seed: string, shortlist = count + 1): T[] {
  const ranked = [...values].sort((left, right) => score(left) - score(right));
  return pick(ranked.slice(0, Math.max(count, shortlist)), count, seed);
}

/** German options for "tap what you hear": similar sound and shape; nouns keep the same article so the noun itself must be heard. */
export function soundAlikes(item: Item, bank: Item[], exclude: Set<string>, seed: string, count = 2): string[] {
  const pool = candidates(item, bank, exclude);
  const target = bare(item);
  const firstWord = target.split(" ")[0];
  const chosen = best(pool, (other) =>
    formDistance(target, bare(other))
    + Math.abs(words(item.de) - words(other.de)) * 0.35
    + (item.gender && other.gender !== item.gender ? 0.4 : 0)
    + (target[0] === bare(other)[0] ? -0.15 : 0)
    + (item.kind === "phrase" && bare(other).split(" ")[0] === firstWord ? -0.25 : 0)
    + (item.kind === "phrase" && ending(item.de) !== ending(other.de) ? 0.2 : 0)
    + (sameTopic(item, other, bank) ? -0.1 : 0), count, seed);
  return chosen.map((other) => other.de);
}

/** English options for "what does this mean?": same kind of word, similar-looking German (easy to confuse), similar length. */
export function meaningAlikes(item: Item, bank: Item[], exclude: Set<string>, seed: string, count = 2): string[] {
  const pool = candidates(item, bank, exclude);
  const target = bare(item);
  const chosen = best(pool, (other) =>
    formDistance(target, bare(other)) * 0.7
    + Math.abs(item.en.length - other.en.length) / Math.max(item.en.length, 8) * 0.5
    + Math.abs(words(item.en) - words(other.en)) * 0.2
    + (ending(item.en) !== ending(other.en) ? 0.3 : 0)
    + (sameTopic(item, other, bank) ? -0.25 : 0), count, seed);
  return [...new Set(chosen.map((other) => other.en))];
}

// Near-miss word forms for sentence building and gaps: the learner must pick the right form, not just the order.
const FAMILIES: string[][] = [
  ["der", "die", "das", "den", "dem"],
  ["ein", "eine", "einen", "einem", "einer"],
  ["kein", "keine", "keinen", "keinem"],
  ["mein", "meine", "meinen", "meinem"],
  ["bin", "bist", "ist", "sind", "seid"],
  ["habe", "hast", "hat", "haben"],
  ["kann", "kannst", "können"],
  ["muss", "musst", "müssen"],
  ["möchte", "möchtest", "möchten"],
  ["war", "warst", "waren"],
  ["um", "am", "im"],
  ["zum", "zur", "zu"],
  ["nach", "zu", "in"],
  ["mit", "bei", "von"],
  ["ich", "du", "er", "wir"],
  ["mich", "mir", "dich", "dir"],
  ["nicht", "kein"],
  ["gern", "gut", "viel"],
  ["guten", "gute", "guter", "gutes"],
  ["morgen", "tag", "abend", "nacht"],
  ["hallo", "tschüss"],
  ["danke", "bitte"],
  ["hier", "dort", "da"],
  ["heute", "morgen", "gestern"],
];

export function formVariants(token: string, verbStems: string[]): string[] {
  const lower = token.toLocaleLowerCase("de");
  const capital = token[0] !== token[0].toLocaleLowerCase("de");
  const style = (value: string) => (capital ? value[0].toLocaleUpperCase("de") + value.slice(1) : value);
  const family = FAMILIES.find((members) => members.includes(lower));
  if (family) return family.filter((member) => member !== lower).map(style);
  const stem = verbStems.find((candidate) => candidate.length >= 3 && lower.startsWith(candidate) && /^(e|st|t|en|n)?$/.test(lower.slice(candidate.length)));
  if (stem) {
    const connector = /[dt]$/.test(stem) ? "e" : "";
    return [`${stem}e`, `${stem}${connector}st`, `${stem}${connector}t`, `${stem}en`].filter((form) => form !== lower).map(style);
  }
  return [];
}

export function verbStemsOf(bank: Item[]): string[] {
  return bank.filter((item) => classify(item) === "verb").map((item) => item.de.replace(/(en|n)$/, "")).sort((left, right) => right.length - left.length);
}

/** Two extra tiles for "build the sentence": near-miss forms of words in the sentence, else same-kind words from the course. */
export function tileDistractors(sentenceTokens: string[], bank: Item[], seed: string, count = 2): string[] {
  const present = new Set(sentenceTokens.map((token) => token.toLocaleLowerCase("de")));
  const stems = verbStemsOf(bank);
  const variants = sentenceTokens.flatMap((token) => formVariants(token, stems).slice(0, 2)).filter((variant) => !present.has(variant.toLocaleLowerCase("de")));
  const unique = [...new Set(variants)];
  const chosen = pick(unique, Math.min(count, unique.length), seed);
  if (chosen.length >= count) return chosen;
  // Keep the real spelling: a lower-case noun would give itself away.
  const filler = seededShuffle(bank.filter((item) => item.kind === "word").map((item) => item.de.replace(/^(der|die|das)\s+/i, "")), `${seed}:filler`)
    .filter((word) => !present.has(word.toLocaleLowerCase("de")) && !word.includes(" ") && word.length > 2);
  return [...chosen, ...filler.slice(0, count - chosen.length)];
}

/** Wrong options for a gap: near-miss forms first, then look-alike words of the same kind. */
export function gapDistractors(gap: string, gapItem: Item | undefined, bank: Item[], exclude: Set<string>, seed: string, count = 2): string[] {
  const forms = formVariants(gap, verbStemsOf(bank));
  if (forms.length >= count) return pick(forms, count, seed);
  if (gapItem) {
    const alikes = soundAlikes(gapItem, bank, exclude, seed, count).map((de) => de.replace(/^(der|die|das)\s+/i, ""));
    return [...forms, ...alikes].slice(0, count);
  }
  return forms;
}
