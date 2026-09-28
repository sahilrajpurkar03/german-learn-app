// Picks the next item for open-ended flashcard/sentence practice (Course → Vocabulary/Sentences).
// Unlike planReview (a fixed-size session of due items), this never runs out: it keeps drawing
// from everything the learner has already met, leaning toward whatever is weakest so far, and
// never repeats the last couple of items in a row.

export type PracticeCandidate = { key: string; strength: number };

/** Low strength = drawn far more often; a word already near "mastered" still appears sometimes. */
export function practiceWeight(strength: number): number {
  return Math.max(0.08, 1 - strength);
}

export function pickPracticeKey<T extends PracticeCandidate>(pool: readonly T[], recent: readonly string[], random: () => number = Math.random): T | null {
  if (!pool.length) return null;
  const avoid = new Set(recent.slice(-Math.min(2, pool.length - 1)));
  const eligible = pool.filter((candidate) => !avoid.has(candidate.key));
  const choices = eligible.length ? eligible : pool;
  const weights = choices.map((candidate) => practiceWeight(candidate.strength));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let index = 0; index < choices.length; index++) {
    roll -= weights[index];
    if (roll <= 0) return choices[index];
  }
  return choices[choices.length - 1];
}

/** 0–100, for a friendly "how well you know this" display. Mirrors memory.ts#strengthOf's scale. */
export function masteryPercent(strength: number): number {
  return Math.round(Math.max(0, Math.min(1, strength)) * 100);
}

export function masteryLabel(strength: number): string {
  if (strength >= 0.8) return "Mastered";
  if (strength >= 0.5) return "Strong";
  if (strength >= 0.2) return "Getting there";
  return "New";
}
