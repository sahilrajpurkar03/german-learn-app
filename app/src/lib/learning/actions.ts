"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ASSESSMENT_BANK } from "@/lib/learning-content";
import { nextAssessmentItem, scoreAssessment, type AssessmentAnswer } from "@/lib/learning-engine";
import { placementToUnit } from "@/lib/course/next-action";
import { DAILY_GOALS } from "@/lib/course/activity";

const timezone = z.string().min(1).max(64).refine((value) => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}, "Unknown timezone");
const goal = z.union([z.literal(DAILY_GOALS[0]), z.literal(DAILY_GOALS[1]), z.literal(DAILY_GOALS[2])]);

async function learner() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error("Your session has expired. Please sign in again.");
  return { client, userId: data.user.id };
}

async function saveSettings(values: Record<string, unknown>) {
  const { client, userId } = await learner();
  const { error } = await client.from("learner_settings").upsert({ user_id: userId, ...values }, { onConflict: "user_id" });
  if (error) throw new Error("Your settings could not be saved. Please try again.");
  return { client, userId };
}

const welcome = z.object({ goal, motivation: z.string().max(60), timezone, start: z.enum(["beginner", "placement"]) }).strict();

/** Onboarding: goal, reason and where to start. Beginners go straight to Unit 1. */
export async function completeWelcome(input: z.infer<typeof welcome>) {
  const data = welcome.parse(input);
  const { client, userId } = await saveSettings({
    daily_goal_xp: data.goal, motivation: data.motivation || null, timezone: data.timezone,
    ...(data.start === "beginner" ? { start_unit: 1, placed_at: new Date().toISOString() } : {}),
  });
  if (data.start === "beginner") await client.from("profiles").update({ placement_completed: true, current_level: "a1" }).eq("id", userId);
  revalidatePath("/today");
  return { next: data.start === "beginner" ? "/lesson/a1-u01-l1" : "/placement" };
}

const placement = z.object({
  answers: z.array(z.object({ id: z.string().max(20), value: z.string().max(500), skipped: z.boolean().optional() })).length(16),
}).strict();

/** Scores the level check on the server and chooses the starting unit. */
export async function savePlacement(answers: AssessmentAnswer[]) {
  const input = placement.parse({ answers });
  const prior: AssessmentAnswer[] = [];
  for (const answer of input.answers) {
    if (nextAssessmentItem(ASSESSMENT_BANK, prior)?.id !== answer.id) throw new Error("The level check is incomplete. Please start it again.");
    prior.push(answer);
  }
  const report = scoreAssessment(ASSESSMENT_BANK, input.answers);
  if (!report.complete) throw new Error("Please answer all four sections.");
  const accuracy = Math.round(report.skills.reduce((sum, skill) => sum + (skill.accuracy ?? 0), 0) / report.skills.length);
  const startUnit = placementToUnit(report.band, accuracy);
  const { client, userId } = await saveSettings({ start_unit: startUnit, placed_at: new Date().toISOString() });
  await client.from("profiles").update({ placement_completed: true, current_level: report.band }).eq("id", userId);
  revalidatePath("/today");
  return { band: report.band, accuracy, startUnit, skills: report.skills.map((skill) => ({ skill: skill.skill, accuracy: skill.accuracy })) };
}

const settings = z.object({
  goal: goal.optional(),
  reminderHour: z.number().int().min(0).max(23).nullable().optional(),
  sound: z.boolean().optional(),
  timezone: timezone.optional(),
}).strict();

export async function updateSettings(input: z.infer<typeof settings>) {
  const data = settings.parse(input);
  await saveSettings({
    ...(data.goal !== undefined ? { daily_goal_xp: data.goal } : {}),
    ...(data.reminderHour !== undefined ? { reminder_hour: data.reminderHour } : {}),
    ...(data.sound !== undefined ? { sound_on: data.sound } : {}),
    ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
  });
  revalidatePath("/me");
  revalidatePath("/today");
}
