export type Skill = "reading" | "listening" | "grammar" | "production";
export type Band = "a1" | "a2" | "b1";
export type AssessmentAnswer = { id: string; value: string; skipped?: boolean };
export type AssessmentItem = {
  id: string;
  skill: Skill;
  band: Band;
  prompt: string;
  context?: string;
  audio?: string;
  options?: string[];
  accepted: string[];
  explanation: string;
};

export const SKILLS: Skill[] = [
  "reading",
  "listening",
  "grammar",
  "production",
];
export const SKILL_NAMES: Record<Skill, string> = {
  reading: "Understanding",
  listening: "Listening",
  grammar: "Sentence patterns",
  production: "Finding the words",
};

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("de-DE")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAccepted(
  item: Pick<AssessmentItem, "accepted">,
  value: string,
): boolean {
  return item.accepted.some(
    (answer) => normalizeAnswer(answer) === normalizeAnswer(value),
  );
}

export function scoreAssessment(
  bank: AssessmentItem[],
  answers: AssessmentAnswer[],
) {
  const unique = new Map(answers.map((answer) => [answer.id, answer]));
  const skills = SKILLS.map((skill) => {
    const items = bank.filter(
      (item) => item.skill === skill && unique.has(item.id),
    );
    const attempted = items.filter((item) => !unique.get(item.id)?.skipped);
    const correct = items.filter((item) => {
      const answer = unique.get(item.id)!;
      return !answer.skipped && isAccepted(item, answer.value);
    });
    return {
      skill,
      total: items.length,
      attempted: attempted.length,
      correct: correct.length,
      accuracy: items.length
        ? Math.round((correct.length / items.length) * 100)
        : null,
      advanced: correct.filter((item) => item.band === "b1").length,
    };
  });
  const measured = skills.filter((entry) => entry.total >= 3);
  const band: Band =
    measured.length === 4 &&
    skills.every((entry) => (entry.accuracy ?? 0) >= 75 && entry.advanced >= 1)
      ? "b1"
      : measured.length === 4 &&
          skills.every((entry) => (entry.accuracy ?? 0) >= 50)
        ? "a2"
        : "a1";
  const focus = [...skills].sort(
    (left, right) => (left.accuracy ?? -1) - (right.accuracy ?? -1),
  )[0].skill;
  return { skills, band, focus, complete: measured.length === 4 };
}

export function nextAssessmentItem(
  bank: AssessmentItem[],
  answers: AssessmentAnswer[],
  perSkill = 4,
): AssessmentItem | null {
  const used = new Set(answers.map((answer) => answer.id));
  for (const skill of SKILLS) {
    const answered = answers.filter((answer) =>
      bank.some((item) => item.id === answer.id && item.skill === skill),
    );
    if (answered.length >= perSkill) continue;
    const last = answered.at(-1);
    const previous = last && bank.find((item) => item.id === last.id);
    const target: Band =
      !last || !previous
        ? "a2"
        : !last.skipped && isAccepted(previous, last.value)
          ? "b1"
          : "a1";
    const available = bank.filter(
      (item) => item.skill === skill && !used.has(item.id),
    );
    const next = available.find((item) => item.band === target) ?? available[0];
    if (next) return next;
  }
  return null;
}

export function dueForCheckin(completedAt: string, now = new Date()): boolean {
  const timestamp = Date.parse(completedAt);
  return (
    Number.isFinite(timestamp) && now.getTime() - timestamp >= 7 * 86400000
  );
}
