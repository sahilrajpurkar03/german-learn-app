import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";
import { batchSchema, currentLearner, LearningError, processBatch } from "@/lib/learning/server";

export async function POST(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Sign in to save your progress." }, 401);
    const parsed = batchSchema.safeParse(await readChapterRequest(request, 64000));
    if (!parsed.success) return privateJson({ error: "The answers could not be read." }, 400);
    return privateJson(await processBatch(learner.user.id, parsed.data.attempts));
  } catch (error) {
    if (error instanceof ChapterHttpError || error instanceof LearningError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Your answers could not be saved yet. They stay on this device and will be sent again." }, 503);
  }
}
