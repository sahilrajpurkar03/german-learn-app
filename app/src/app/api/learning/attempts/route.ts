import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";
import { batchSchema, currentLearner, LearningError, processBatch } from "@/lib/learning/server";

export async function POST(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Your session has expired. Please sign in again.", stage: "auth" }, 401);
    const parsed = batchSchema.safeParse(await readChapterRequest(request, 64000));
    if (!parsed.success) return privateJson({ error: "The answers could not be read.", stage: "validate" }, 400);
    return privateJson(await processBatch(learner.user.id, parsed.data.attempts));
  } catch (error) {
    if (error instanceof ChapterHttpError) return privateJson({ error: error.message, stage: "request" }, error.status);
    if (error instanceof LearningError) return privateJson({ error: error.message, stage: error.stage, code: error.code }, error.status);
    console.error("[learning] unexpected", error instanceof Error ? `${error.name}: ${error.message}` : "unknown error");
    return privateJson({ error: "Your answers could not be saved yet. They stay on this device and will be sent again.", stage: "server", code: error instanceof Error ? error.name : undefined }, 503);
  }
}
