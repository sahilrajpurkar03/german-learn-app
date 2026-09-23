// XP, daily goal and streak rules. Pure functions shared by the server (source of truth)
// and the demo/offline client.

import type { Verdict } from "./types.ts";

export const DAILY_GOALS = [30, 50, 80] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number];
export const GOAL_NAMES: Record<DailyGoal, string> = { 30: "Casual", 50: "Regular", 80: "Serious" };
export const LESSON_BONUS = 10;
export const REVIEW_BONUS = 5;
export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;

export function xpFor(verdict: Verdict, retry: boolean): number {
  if (verdict === "seen" || verdict === "wrong") return 0;
  return retry ? 1 : 2;
}

export type DayActivity = { date: string; xp: number; goalXp: number; goalMet: boolean; freezeUsed: boolean };
export type StreakStats = { current: number; longest: number; lastDate: string | null; freezes: number; freezeProgress: number };

export const EMPTY_STATS: StreakStats = { current: 0, longest: 0, lastDate: null, freezes: 0, freezeProgress: 0 };

/** Calendar date (YYYY-MM-DD) of an instant in the learner's timezone. */
export function localDate(at: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

export function localHour(at: Date, timeZone: string): number {
  try {
    return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(at));
  } catch {
    return at.getUTCHours();
  }
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
}

/** Called once, on the day the goal is first met. Returns new stats and any past dates covered by a freeze. */
export function meetGoal(stats: StreakStats, today: string): { stats: StreakStats; frozenDates: string[] } {
  if (stats.lastDate === today) return { stats, frozenDates: [] };
  const gap = stats.lastDate ? daysBetween(stats.lastDate, today) - 1 : Infinity;
  let current = 1;
  let freezes = stats.freezes;
  const frozenDates: string[] = [];
  if (gap === 0) current = stats.current + 1;
  else if (Number.isFinite(gap) && gap > 0 && gap <= freezes && stats.current > 0) {
    freezes -= gap;
    for (let offset = 1; offset <= gap; offset++) frozenDates.push(addDays(stats.lastDate!, offset));
    current = stats.current + 1;
  }
  let freezeProgress = stats.freezeProgress + 1;
  if (freezeProgress >= FREEZE_EVERY) {
    freezeProgress = 0;
    freezes = Math.min(MAX_FREEZES, freezes + 1);
  }
  return { stats: { current, longest: Math.max(stats.longest, current), lastDate: today, freezes, freezeProgress }, frozenDates };
}

/** The streak as it should be shown today: still alive if yesterday was met or freezes can cover the gap. */
export function visibleStreak(stats: StreakStats, today: string): number {
  if (!stats.lastDate || stats.current === 0) return 0;
  const missed = daysBetween(stats.lastDate, today) - 1;
  if (missed <= 0) return stats.current;
  return missed <= stats.freezes ? stats.current : 0;
}

export type WeekDay = { date: string; label: string; state: "met" | "freeze" | "missed" | "today" | "future" | "partial" };

export function weekStrip(days: DayActivity[], today: string): WeekDay[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const day = byDate.get(date);
    const label = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" });
    const state: WeekDay["state"] = day?.goalMet ? "met" : day?.freezeUsed ? "freeze" : date === today ? (day?.xp ? "partial" : "today") : day?.xp ? "partial" : "missed";
    return { date, label, state };
  });
}
