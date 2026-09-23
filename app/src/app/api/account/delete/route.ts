import { z } from "zod";
import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";
import { AUDIO_BUCKET } from "@/lib/personal-chapter-server";
import { currentLearner, LearningError, learningAdmin } from "@/lib/learning/server";

// Permanently deletes the signed-in account. Every table references auth.users with
// ON DELETE CASCADE, so removing the user removes their rows; any stored recordings are
// removed from Storage first because Storage objects do not cascade.
export async function POST(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Sign in first." }, 401);
    const parsed = z.object({ confirm: z.literal("DELETE") }).strict().safeParse(await readChapterRequest(request, 200));
    if (!parsed.success) return privateJson({ error: "Type DELETE to confirm." }, 400);
    const userId = learner.user.id;
    const admin = learningAdmin();

    const jobs = await admin.from("personal_chapter_jobs").select("audio_path").eq("user_id", userId);
    if (jobs.error && jobs.error.code !== "42P01" && jobs.error.code !== "PGRST205") throw new LearningError(503, "Deletion is unavailable right now. Nothing was deleted.");
    const paths = (jobs.data ?? []).flatMap((job) => (job.audio_path ? [job.audio_path] : []));
    if (paths.length) {
      const removed = await admin.storage.from(AUDIO_BUCKET).remove(paths);
      if (removed.error) throw new LearningError(503, "Your recordings could not be removed, so nothing was deleted. Please try again.");
    }
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error) throw new LearningError(503, "Deletion is unavailable right now. Please try again later.");
    await learner.client.auth.signOut().catch(() => undefined);
    return privateJson({ ok: true });
  } catch (error) {
    if (error instanceof ChapterHttpError || error instanceof LearningError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Deletion failed. Nothing was deleted." }, 503);
  }
}
