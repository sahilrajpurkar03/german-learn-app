import { timingSafeEqual } from "node:crypto";
import { AUDIO_BUCKET, personalAdmin } from "@/lib/personal-chapter-server";
import { privateJson } from "@/lib/chapter-http";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  if (!secret || secret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return privateJson({ error: "Unauthorized" }, 401);
  try {
    const client = personalAdmin();
    const { data: jobs, error } = await client.from("personal_chapter_jobs").select("id,audio_path").lt("expires_at", new Date().toISOString()).limit(200);
    if (error) throw error;
    const paths = (jobs ?? []).flatMap((job) => job.audio_path ? [job.audio_path] : []);
    if (paths.length) {
      const removed = await client.storage.from(AUDIO_BUCKET).remove(paths);
      if (removed.error) throw removed.error;
    }
    const ids = (jobs ?? []).map((job) => job.id);
    if (ids.length) {
      const result = await client.from("personal_chapter_jobs").delete().in("id", ids).lt("expires_at", new Date().toISOString());
      if (result.error) throw result.error;
    }
    return privateJson({ removed: ids.length });
  } catch { return privateJson({ error: "Cleanup failed. Retry and check storage availability." }, 503); }
}