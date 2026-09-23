import { z } from "zod";
import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";
import { chapterBlueprintSchema } from "@/lib/personal-chapters";
import { customItemKey } from "@/lib/course/custom";
import { introduce } from "@/lib/course/memory";
import { currentLearner, LearningError, learningAdmin } from "@/lib/learning/server";

const body = z.object({ chapterId: z.string().uuid(), index: z.number().int().min(0).max(5) }).strict();

// Adds one target phrase of the learner's own custom lesson to their review queue.
export async function POST(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Sign in first." }, 401);
    const parsed = body.safeParse(await readChapterRequest(request, 2000));
    if (!parsed.success) return privateJson({ error: "Invalid request." }, 400);
    const db = learningAdmin();
    const chapter = await db.from("personal_chapters").select("blueprint").eq("id", parsed.data.chapterId).eq("user_id", learner.user.id).maybeSingle();
    if (chapter.error) throw new LearningError(503, "Storage is unavailable.");
    const blueprint = chapterBlueprintSchema.safeParse(chapter.data?.blueprint);
    if (!blueprint.success || !blueprint.data.targets[parsed.data.index]) return privateJson({ error: "Chapter not found." }, 404);
    const state = introduce(customItemKey(parsed.data.chapterId, parsed.data.index), new Date());
    const write = await db.from("learner_items").upsert({
      user_id: learner.user.id, item_key: state.key, ease: state.ease, interval_days: state.intervalDays, repetitions: state.repetitions, due_at: state.dueAt,
      strength: state.strength, lapses: 0, seen_count: state.seen, correct_count: 0, introduced_at: state.introducedAt, last_seen_at: state.lastSeenAt, source: "custom",
    }, { onConflict: "user_id,item_key", ignoreDuplicates: true });
    if (write.error) throw new LearningError(503, "Storage is unavailable.");
    return privateJson({ ok: true });
  } catch (error) {
    if (error instanceof ChapterHttpError || error instanceof LearningError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Could not add this phrase to review." }, 503);
  }
}
