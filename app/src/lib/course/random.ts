// Deterministic helpers: the same step id always produces the same option order, so the
// server can rebuild exactly what the learner saw.

export function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

export function hashHex(text: string): string {
  return hash(text).toString(16).padStart(8, "0");
}

function generator(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(values: readonly T[], seed: string): T[] {
  const next = generator(seed);
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(next() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Shuffle, but never return the original order when there is more than one distinct element. */
export function scramble<T>(values: readonly T[], seed: string): T[] {
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = seededShuffle(values, `${seed}:${attempt}`);
    if (result.some((value, index) => value !== values[index])) return result;
  }
  return [...values].reverse();
}

export function pick<T>(values: readonly T[], count: number, seed: string): T[] {
  return seededShuffle(values, seed).slice(0, count);
}
