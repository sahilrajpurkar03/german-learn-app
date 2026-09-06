// SM-2 based spaced repetition scheduler.
// grade: 0-2 = wrong/hard resets progress, 3 = ok, 4 = good, 5 = easy.

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
}

const MIN_EASE_FACTOR = 1.3;

export function schedule(state: SrsState, grade: 0 | 1 | 2 | 3 | 4 | 5, now: Date = new Date()): SrsResult {
  let { easeFactor, intervalDays, repetitions } = state;

  if (grade < 3) {
    repetitions = 0;
    intervalDays = grade === 2 ? 1 : 0; // "hard" retries later today/tomorrow, "wrong" comes back immediately
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  }

  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)),
  );

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  if (intervalDays === 0) {
    // still due later in the same session
    dueAt.setMinutes(dueAt.getMinutes() + 10);
  }

  return { easeFactor, intervalDays, repetitions, dueAt };
}

export function initialSrsState(): SrsState {
  return { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };
}
