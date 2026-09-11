"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ASSESSMENT_BANK } from "@/lib/learning-content";
import { nextAssessmentItem, scoreAssessment } from "@/lib/learning-engine";
import type { AssessmentAnswer } from "@/lib/learning-engine";
import { nextCheckinDate } from "@/lib/content";

const submission = z.object({
  answers: z
    .array(
      z.object({
        id: z.string().max(20),
        value: z.string().max(500),
        skipped: z.boolean().optional(),
      }),
    )
    .length(16),
  goal: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]),
});

export async function saveStudioAssessment(
  answers: AssessmentAnswer[],
  goal: number,
) {
  const input = submission.parse({ answers, goal });
  const prior: AssessmentAnswer[] = [];
  for (const answer of input.answers) {
    if (nextAssessmentItem(ASSESSMENT_BANK, prior)?.id !== answer.id)
      throw new Error(
        "The assessment sequence is incomplete. Please restart the assessment.",
      );
    prior.push(answer);
  }
  const report = scoreAssessment(ASSESSMENT_BANK, input.answers);
  if (!report.complete)
    throw new Error("Please complete all four skill sections.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session has expired. Please sign in again.");
  const { data, error } = await supabase
    .from("profiles")
    .update({
      current_level: report.band,
      placement_completed: true,
      daily_goal_minutes: input.goal,
      next_checkin_at: nextCheckinDate(),
    })
    .eq("id", user.id)
    .select("id")
    .single();
  if (error || !data)
    throw new Error(
      "Your result could not be saved. Your answers are still on this device; please try again.",
    );
  revalidatePath("/learn");
}
