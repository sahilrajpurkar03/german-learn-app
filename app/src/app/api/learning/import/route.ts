import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";
import { catalog, getItem } from "@/lib/course/catalog";
import { legacyImportSchema, mapLegacy } from "@/lib/course/legacy-import";
import { currentLearner, DEFAULT_SETTINGS, LearningError, learningAdmin } from "@/lib/learning/server";

// One-time import of progress that v1 kept in this browser. The learner can only ever
// affect their own memory rows, and only once (legacy_imported_at is server-set).
export async function POST(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Sign in first." }, 401);
    const parsed = legacyImportSchema.safeParse(await readChapterRequest(request, 400000));
    if (!parsed.success) return privateJson({ error: "The saved progress could not be read." }, 400);
    const userId = learner.user.id;
    const db = learningAdmin();
    const settings = await db.from("learner_settings").select("*").eq("user_id", userId).maybeSingle();
    if (settings.error) throw new LearningError(503, "Progress storage is unavailable.");
    if (settings.data?.legacy_imported_at) return privateJson({ imported: 0, already: true });

    const turnItems = [...catalog().items.values()].filter((item) => item.id.startsWith("t."));
    const mapped = mapLegacy(parsed.data, getItem, turnItems, new Date());
    const existing = await db.from("learner_items").select("item_key").eq("user_id", userId);
    const have = new Set((existing.data ?? []).map((row) => row.item_key));
    const rows = mapped.items.filter((state) => !have.has(state.key)).map((state) => ({
      user_id: userId, item_key: state.key, ease: state.ease, interval_days: state.intervalDays, repetitions: state.repetitions, due_at: state.dueAt,
      strength: state.strength, lapses: state.lapses, seen_count: state.seen, correct_count: state.correct, introduced_at: state.introducedAt, last_seen_at: state.lastSeenAt, source: "legacy" as const,
    }));
    if (rows.length) {
      const write = await db.from("learner_items").upsert(rows, { onConflict: "user_id,item_key", ignoreDuplicates: true });
      if (write.error) throw new LearningError(503, "Progress storage is unavailable.");
    }
    const lessons = mapped.completedLessons.filter((entry) => catalog().lessons.has(entry.lessonId)).map((entry) => ({
      user_id: userId, lesson_id: entry.lessonId, status: "completed" as const, step_index: 0, completed_count: 1, completed_at: entry.at, updated_at: new Date().toISOString(),
    }));
    if (lessons.length) {
      const write = await db.from("lesson_progress").upsert(lessons, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
      if (write.error) throw new LearningError(503, "Progress storage is unavailable.");
    }
    const marker = await db.from("learner_settings").upsert({
      ...(settings.data ?? { ...DEFAULT_SETTINGS, user_id: userId, daily_goal_xp: mapped.goalXp ?? DEFAULT_SETTINGS.daily_goal_xp }),
      user_id: userId, legacy_imported_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (marker.error) throw new LearningError(503, "Progress storage is unavailable.");
    return privateJson({ imported: rows.length, lessons: lessons.length });
  } catch (error) {
    if (error instanceof ChapterHttpError || error instanceof LearningError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Import failed. Your earlier progress is still on this device." }, 503);
  }
}
