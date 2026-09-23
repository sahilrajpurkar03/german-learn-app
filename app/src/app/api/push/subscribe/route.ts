import { z } from "zod";
import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";
import { currentLearner, LearningError, learningAdmin } from "@/lib/learning/server";
import { pushConfigured } from "@/lib/learning/push";

const subscription = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(4).max(100) }),
}).strip();

export async function POST(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Sign in first." }, 401);
    if (!pushConfigured()) return privateJson({ error: "Reminders are not set up on this server yet." }, 503);
    const parsed = subscription.safeParse(await readChapterRequest(request, 4000));
    if (!parsed.success) return privateJson({ error: "This browser's notification details could not be read." }, 400);
    const db = learningAdmin();
    const write = await db.from("push_subscriptions").upsert({ user_id: learner.user.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, failures: 0 }, { onConflict: "endpoint" });
    if (write.error) throw new LearningError(503, "Could not save the reminder.");
    return privateJson({ ok: true });
  } catch (error) {
    if (error instanceof ChapterHttpError || error instanceof LearningError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Could not save the reminder." }, 503);
  }
}

export async function DELETE(request: Request) {
  try {
    const learner = await currentLearner();
    if (!learner) return privateJson({ error: "Sign in first." }, 401);
    const parsed = z.object({ endpoint: z.string().max(1000) }).strip().safeParse(await readChapterRequest(request, 2000));
    if (!parsed.success) return privateJson({ error: "Invalid request." }, 400);
    const result = await learner.client.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint).eq("user_id", learner.user.id);
    if (result.error) throw new LearningError(503, "Could not turn reminders off.");
    return privateJson({ ok: true });
  } catch (error) {
    if (error instanceof ChapterHttpError || error instanceof LearningError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Could not turn reminders off." }, 503);
  }
}
