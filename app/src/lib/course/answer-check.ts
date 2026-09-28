import { SKIP_SPEAKING, SPOKEN_TYPES } from "./types.ts";
import type { Step, Verdict } from "./types.ts";

export type DiffToken = { token: string; ok: boolean };
export type CheckResult = {
  verdict: Verdict;
  expected: string;
  feedback?: string;
  /** the expected answer, token by token, marked where the learner's answer differed */
  diff?: DiffToken[];
};

/** Words whose exact form is the point of the exercise: a typo here is a real mistake. */
const CRITICAL = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "kein", "keine", "keinen", "keinem", "keiner", "mein", "meine", "meinen", "dein", "deine", "deinen",
  "ich", "du", "er", "sie", "es", "wir", "ihr", "mich", "mir", "dich", "dir", "ihn", "ihm", "uns", "euch", "ihnen",
  "bin", "bist", "ist", "sind", "seid", "habe", "hast", "hat", "haben", "habt",
  "nicht", "im", "am", "zum", "zur", "vom", "beim",
]);

// Speech recognition writes spoken numbers as digits ("zehn Uhr" comes back as "10:00 Uhr" or
// "10 Uhr"), so a spoken answer must be able to match a written-out number and vice versa.
const NUMBER_UNITS: Record<string, number> = { null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
const NUMBER_TEENS: Record<string, number> = { zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
const NUMBER_TENS: Record<string, number> = { zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
const NUMBER_COMPOUND = /^(ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/;

function germanWordToNumber(word: string): number | null {
  if (word === "hundert" || word === "einhundert") return 100;
  if (word in NUMBER_TEENS) return NUMBER_TEENS[word];
  if (word in NUMBER_TENS) return NUMBER_TENS[word];
  if (word in NUMBER_UNITS) return NUMBER_UNITS[word];
  const compound = NUMBER_COMPOUND.exec(word);
  return compound ? NUMBER_UNITS[compound[1]] + NUMBER_TENS[compound[2]] : null;
}

/** "10:00" (on the hour, as speech recognition writes it) has no spoken "null" for the minutes,
 * so it collapses to "10"; "10:30" becomes "10 30" to line up with "zehn Uhr dreißig". */
function collapseClockTime(value: string): string {
  return value.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, hour: string, minute: string) => (minute === "00" ? hour : `${hour} ${minute}`));
}

export function normalize(value: string): string {
  return collapseClockTime(value)
    .normalize("NFC")
    .toLocaleLowerCase("de-DE")
    .replace(/[„“”"'’‚‘«»]/g, "")
    .replace(/[.,!?;:¿¡…–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => { const number = germanWordToNumber(token); return number === null ? token : String(number); })
    .join(" ");
}

export function foldUmlauts(value: string): string {
  return value.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

export function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column++) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function similarity(left: string, right: string): number {
  const longest = Math.max(left.length, right.length);
  return longest === 0 ? 1 : 1 - editDistance(left, right) / longest;
}

function diffTokens(expected: string, answer: string): DiffToken[] {
  const given = normalize(answer).split(" ");
  return expected.split(/\s+/).filter(Boolean).map((token, index) => {
    const plain = normalize(token);
    return { token, ok: given[index] === plain || (given.includes(plain) && !CRITICAL.has(plain)) };
  });
}

type TextVerdict = { verdict: Verdict; feedback?: string };

function compareText(expected: string, answer: string, critical: Set<string>, lenient: boolean): TextVerdict {
  const target = normalize(expected);
  const given = normalize(answer);
  if (!given) return { verdict: "wrong" };
  if (target === given) return { verdict: "correct" };
  if (foldUmlauts(target) === foldUmlauts(given)) {
    const word = expected.split(/\s+/).find((token) => /[äöüßÄÖÜ]/.test(token) && !given.includes(normalize(token)));
    return { verdict: "close", feedback: word ? `Watch the spelling: ${word.replace(/[.,!?]/g, "")}` : "Watch the umlauts (ä, ö, ü, ß)." };
  }
  if (lenient && similarity(foldUmlauts(target), foldUmlauts(given)) >= 0.8) return { verdict: "correct" };
  const targetTokens = foldUmlauts(target).split(" ");
  const givenTokens = foldUmlauts(given).split(" ");
  if (targetTokens.length !== givenTokens.length) return { verdict: "wrong" };
  const originalTokens = target.split(" ");
  let typos = 0;
  let typoWord = "";
  for (let index = 0; index < targetTokens.length; index++) {
    const want = targetTokens[index];
    const got = givenTokens[index];
    if (want === got) continue;
    if (critical.has(originalTokens[index]) || want.length < 4 || editDistance(want, got) > 1) return { verdict: "wrong" };
    typos += 1;
    typoWord = expected.split(/\s+/)[index]?.replace(/[.,!?]/g, "") ?? want;
  }
  return typos <= 2 ? { verdict: "close", feedback: `Almost! Check the spelling of “${typoWord}”.` } : { verdict: "wrong" };
}

const CHOICE_TYPES = new Set(["choose", "listen_tap", "listen_choose", "article"]);

export function checkAnswer(step: Step, answer: string): CheckResult {
  const expected = step.accepted[0] ?? "";
  if (step.type === "intro" || step.type === "pattern") return { verdict: "seen", expected };
  if (SPOKEN_TYPES.has(step.type) && answer === SKIP_SPEAKING) return { verdict: "seen", expected };

  if (CHOICE_TYPES.has(step.type) || (step.type === "fill_gap" && step.options)) {
    const correct = step.accepted.some((option) => normalize(option) === normalize(answer));
    return correct
      ? { verdict: "correct", expected }
      : { verdict: "wrong", expected, feedback: step.why?.[answer] };
  }

  if (step.type === "match") {
    let pairs: unknown;
    try { pairs = JSON.parse(answer); } catch { pairs = null; }
    if (!Array.isArray(pairs) || !step.pairs) return { verdict: "wrong", expected };
    const valid = new Set(step.pairs.map(([de, en]) => `${de}\u0000${en}`));
    const attempts = pairs.filter((pair): pair is [string, string] => Array.isArray(pair) && pair.length === 2 && pair.every((part) => typeof part === "string"));
    const matched = new Set(attempts.filter(([de, en]) => valid.has(`${de}\u0000${en}`)).map(([de, en]) => `${de}\u0000${en}`));
    const mistakes = attempts.filter(([de, en]) => !valid.has(`${de}\u0000${en}`)).length;
    if (matched.size !== valid.size) return { verdict: "wrong", expected };
    return { verdict: mistakes === 0 ? "correct" : mistakes === 1 ? "close" : "wrong", expected, feedback: mistakes ? `${mistakes} mismatched ${mistakes === 1 ? "pair" : "pairs"} on the way.` : undefined };
  }

  if (step.type === "build") {
    const correct = step.accepted.some((option) => normalize(option) === normalize(answer));
    return correct ? { verdict: "correct", expected } : { verdict: "wrong", expected, diff: diffTokens(expected, answer), feedback: step.why?.[normalize(answer)] };
  }

  const critical = new Set([...CRITICAL, ...(step.critical ?? []).map(normalize)]);
  const lenient = SPOKEN_TYPES.has(step.type);
  let best: TextVerdict & { expected: string } = { verdict: "wrong", expected };
  for (const option of step.accepted) {
    const result = compareText(option, answer, critical, lenient);
    if (result.verdict === "correct") return { verdict: "correct", expected: option };
    if (result.verdict === "close" && best.verdict !== "close") best = { ...result, expected: option };
  }
  if (best.verdict === "close") return best;
  if (step.selfCheck) return { verdict: "seen", expected, feedback: "Compare your reply with this model answer. Other wording can be just as good." };
  const hint = Object.entries(step.why ?? {}).find(([wrong]) => normalize(wrong) === normalize(answer))?.[1];
  return { verdict: "wrong", expected, diff: diffTokens(expected, answer), feedback: hint };
}
