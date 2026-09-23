import { localDate, localHour } from "./activity.ts";

export type ReminderCandidate = {
  timezone: string;
  reminderHour: number | null;
  todayXp: number;
  goalXp: number;
  streak: number;
  lastSentOn: string | null;
  lastRecapOn: string | null;
};

/** Send at most one nudge a day, at the learner's chosen hour, and only if today's goal is still open. Sundays bring the weekly recap instead. */
export function reminderKind(candidate: ReminderCandidate, now: Date): "reminder" | "recap" | null {
  if (candidate.reminderHour === null) return null;
  if (localHour(now, candidate.timezone) !== candidate.reminderHour) return null;
  const today = localDate(now, candidate.timezone);
  const sunday = new Date(`${today}T12:00:00Z`).getUTCDay() === 0;
  if (sunday && candidate.lastRecapOn !== today) return "recap";
  if (candidate.lastSentOn === today || candidate.todayXp >= candidate.goalXp) return null;
  return "reminder";
}

export function reminderMessage(kind: "reminder" | "recap", candidate: ReminderCandidate, week: { xp: number; lessons: number; words: number }): { title: string; body: string; url: string } {
  if (kind === "recap") {
    return {
      title: "Your week in German",
      body: week.xp ? `${week.xp} XP, ${week.lessons} ${week.lessons === 1 ? "lesson" : "lessons"} and ${week.words} words practised. Schön gemacht!` : "A new week starts tomorrow. Five minutes is enough to begin.",
      url: "/me/progress",
    };
  }
  const left = Math.max(0, candidate.goalXp - candidate.todayXp);
  return {
    title: candidate.streak > 0 ? `Keep your ${candidate.streak}-day streak 🔥` : "Time for a little German",
    body: candidate.todayXp > 0 ? `Only ${left} XP to today's goal.` : "One short lesson keeps the words fresh.",
    url: "/today",
  };
}
