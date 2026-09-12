import { z } from "zod";
import { chapterBlueprintSchema, progressSchema } from "@/lib/personal-chapters";
import { demoPersonalChapter } from "@/lib/personal-chapter-demo";

const librarySchema = z.object({
  chapters: z.array(z.object({ id: z.string().uuid(), created_at: z.string(), blueprint: chapterBlueprintSchema, progress: z.partialRecord(z.enum(["original", "variation"]), progressSchema) })),
  reviews: z.array(z.object({ chapter_id: z.string(), target_index: z.number(), due_at: z.string(), updated_at: z.string(), repetitions: z.number() })),
  available: z.boolean(),
  message: z.string().nullable().optional(),
});
export type PersonalLibrary = z.infer<typeof librarySchema> & { demo?: boolean; loadedAt?: number };
export class ChapterApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function result(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ChapterApiError(response.status, typeof data?.error === "string" ? data.error : "The request did not complete. Keep your draft and try again.");
  return data;
}

export async function getPersonalLibrary(preview: boolean, signal?: AbortSignal): Promise<PersonalLibrary> {
  const response = await fetch("/api/personal-chapters", { cache: "no-store", signal });
  if (response.status === 401 && preview) return { chapters: [demoPersonalChapter()], reviews: [], available: false, demo: true, loadedAt: Date.now(), message: "Sample chapter, not AI-generated. Sign in to create private chapters once AI setup is enabled." };
  return { ...librarySchema.parse(await result(response)), loadedAt: Date.now() };
}

export async function chapterRequest<T = { ok: boolean }>(operation: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 95000);
  try {
    return await result(await fetch("/api/personal-chapters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(operation), signal: controller.signal, cache: "no-store" }));
  } catch (error) {
    if (controller.signal.aborted) throw new ChapterApiError(408, "The request timed out. Refresh your library before retrying; the chapter may have finished saving.");
    throw error;
  } finally { clearTimeout(timer); }
}