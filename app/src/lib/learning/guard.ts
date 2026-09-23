import "server-only";
import { redirect } from "next/navigation";
import { v2Enabled } from "../v2";
import { currentLearner, loadSnapshot } from "./server";

/** Every v2 page: behind the rollout switch and signed in. */
export async function requireLearner() {
  if (!(await v2Enabled())) redirect("/learn");
  const learner = await currentLearner();
  if (!learner) redirect("/login");
  return learner;
}

export async function requireSnapshot() {
  const learner = await requireLearner();
  const snapshot = await loadSnapshot(learner.client, learner.user.id);
  return { ...learner, snapshot };
}

export async function displayName(client: Awaited<ReturnType<typeof requireLearner>>["client"], userId: string): Promise<string> {
  const { data } = await client.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  return data?.display_name?.trim() || "there";
}
