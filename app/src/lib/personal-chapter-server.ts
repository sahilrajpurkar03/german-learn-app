import "server-only";
import { createHash } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseBuffer } from "music-metadata";
import { z } from "zod";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";
import type { Json } from "./personal-database";
import { createChapterAI } from "./chapter-ai";
import { AUDIO_TYPES, chapterBlueprintSchema, chapterInputSchema, PERSONAL_LIMITS, progressSchema } from "./personal-chapters";
import type { PersonalChapter } from "./personal-chapters";
import { ChapterHttpError, providerFailure } from "./chapter-http";
import { schedule } from "./srs";

export const AUDIO_BUCKET = "personal-chapter-audio";
type Client = SupabaseClient<Database>;
const identifier = z.string().uuid();
const operationSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("createUpload"), requestId: identifier, mime: z.enum(["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "audio/flac"]), bytes: z.number().int().positive().max(PERSONAL_LIMITS.audioBytes), seconds: z.number().positive().max(PERSONAL_LIMITS.audioSeconds), language: z.enum(["en", "de"]), consent: z.literal(true) }).strict(),
  z.object({ op: z.literal("transcribe"), requestId: identifier }).strict(),
  z.object({ op: z.literal("discardUpload"), requestId: identifier }).strict(),
  z.object({ op: z.literal("generate"), requestId: identifier, input: chapterInputSchema, uploadId: identifier.optional() }).strict(),
  z.object({ op: z.literal("progress"), id: identifier, variant: z.enum(["original", "variation"]), progress: progressSchema }).strict(),
  z.object({ op: z.literal("addReview"), id: identifier, index: z.number().int().min(0).max(5) }).strict(),
  z.object({ op: z.literal("rateReview"), id: identifier, index: z.number().int().min(0).max(5), grade: z.union([z.literal(0), z.literal(3), z.literal(5)]), revision: z.string().datetime({ offset: true }) }).strict(),
  z.object({ op: z.literal("delete"), id: identifier }).strict(),
]);

export function personalAdmin(): Client {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ChapterHttpError(503, "Private chapter storage is not configured yet.");
  return createSupabaseClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function generationAvailable() {
  return process.env.PERSONAL_CHAPTERS_ENABLED === "true" && !!process.env.GROQ_API_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.CRON_SECRET?.length ?? 0) >= 32;
}

async function actor() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new ChapterHttpError(401, "Sign in to use your private chapters.");
  return { client, userId: data.user.id };
}

function databaseError(error: unknown) {
  if (error) throw new ChapterHttpError(503, "Private storage is unavailable. Nothing was confirmed as saved; please try again.");
}

async function ownedChapter(client: Client, userId: string, id: string) {
  const { data, error } = await client.from("personal_chapters").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  databaseError(error);
  if (!data) throw new ChapterHttpError(404, "Chapter not found.");
  return { ...data, blueprint: chapterBlueprintSchema.parse(data.blueprint) };
}

export async function readPersonalLibrary() {
  const { client, userId } = await actor();
  const { data: chapters, error } = await client.from("personal_chapters").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  if (error?.code === "42P01" || error?.code === "PGRST205")
    return { chapters: [], reviews: [], available: false, message: "Personal chapters are not configured yet. The existing practice library is still available." };
  databaseError(error);
  const [progress, reviews] = await Promise.all([
    client.from("personal_chapter_progress").select("*").eq("user_id", userId),
    client.from("personal_chapter_reviews").select("*").eq("user_id", userId).order("due_at"),
  ]);
  databaseError(progress.error || reviews.error);
  const records: PersonalChapter[] = (chapters ?? []).map((chapter) => ({
    id: chapter.id,
    created_at: chapter.created_at,
    blueprint: chapterBlueprintSchema.parse(chapter.blueprint),
    progress: Object.fromEntries((progress.data ?? []).filter((entry) => entry.chapter_id === chapter.id).map((entry) => [entry.variant, { index: entry.turn_index, correct: entry.correct, completed: entry.completed }])),
  }));
  return { chapters: records, reviews: reviews.data ?? [], available: generationAvailable(), message: generationAvailable() ? null : "New chapter creation is not configured yet. Saved chapters remain available." };
}

async function ownedJob(client: Client, userId: string, id: string) {
  const { data, error } = await client.from("personal_chapter_jobs").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  databaseError(error);
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) throw new ChapterHttpError(410, "This creation session expired. Start a new one.");
  return data;
}

async function reserve(client: Client, userId: string, requestId: string, kind: "transcribe" | "generate", input: unknown, extension?: string) {
  const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const { data, error } = await client.rpc("reserve_personal_chapter_job", { actor: userId, job_id: requestId, job_kind: kind, digest, audio_extension: extension ?? null });
  databaseError(error);
  if (data === "user_limit") throw new ChapterHttpError(429, "Your two daily attempts are used. Saved chapters are still available. Try creation again after midnight UTC.");
  if (data === "global_limit") throw new ChapterHttpError(429, "Today's free creation capacity is full. Saved chapters are still available. Try again after midnight UTC.");
  if (data === "busy") throw new ChapterHttpError(429, "Another chapter is being created. Keep your text and try again in 75 seconds.");
  if (data === "conflict") throw new ChapterHttpError(409, "This request belongs to a different creation. Start again with a new request.");
  if (data !== "reserved" && data !== "existing") throw new ChapterHttpError(503, "Could not reserve creation capacity.");
  return data;
}

async function claim(client: Client, userId: string, id: string, status: string) {
  const { data, error } = await client.from("personal_chapter_jobs").update({ status: "processing" }).eq("id", id).eq("user_id", userId).eq("status", status).gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
  databaseError(error);
  if (!data) throw new ChapterHttpError(409, "This request is already running or finished. Refresh your library before starting another.");
}

export async function clearAudio(client: Client, userId: string, id: string) {
  const { data: job, error } = await client.from("personal_chapter_jobs").select("*").eq("id", id).eq("user_id", userId).eq("kind", "transcribe").maybeSingle();
  databaseError(error);
  if (!job) return;
  const stopped = await client.from("personal_chapter_jobs").update({ status: "cancelled", output: null }).eq("id", id).eq("user_id", userId);
  databaseError(stopped.error);
  if (job.audio_path) {
    const removed = await client.storage.from(AUDIO_BUCKET).remove([job.audio_path]);
    databaseError(removed.error);
  }
}

export async function changePersonalLibrary(value: unknown) {
  const parsed = operationSchema.safeParse(value);
  if (!parsed.success) throw new ChapterHttpError(400, "Check the text, permission, and file limits before continuing.");
  const operation = parsed.data;
  const { userId } = await actor();
  const client = personalAdmin();
  if (["createUpload", "transcribe", "generate"].includes(operation.op) && !generationAvailable())
    throw new ChapterHttpError(503, "AI creation is not configured. You can still use saved chapters and the existing library.");

  if (operation.op === "createUpload") {
    const status = await reserve(client, userId, operation.requestId, "transcribe", operation, AUDIO_TYPES[operation.mime]);
    if (status === "reserved") {
      const result = await client.from("personal_chapter_jobs").update({ output: { mime: operation.mime, language: operation.language, bytes: operation.bytes } }).eq("id", operation.requestId).eq("user_id", userId);
      databaseError(result.error);
    }
    const job = await ownedJob(client, userId, operation.requestId);
    if (job.status !== "awaiting_upload") throw new ChapterHttpError(409, "This upload was already processed. Start a new recording.");
    return { path: job.audio_path, bucket: AUDIO_BUCKET };
  }

  if (operation.op === "discardUpload") {
    await clearAudio(client, userId, operation.requestId);
    return { ok: true };
  }

  if (operation.op === "transcribe") {
    const job = await ownedJob(client, userId, operation.requestId);
    if (job.kind !== "transcribe") throw new ChapterHttpError(404, "Recording not found.");
    if (job.status === "complete") return job.output;
    if (!job.audio_path) throw new ChapterHttpError(410, "Recording expired.");
    await claim(client, userId, job.id, "awaiting_upload");
    try {
      const metadata = z.object({ mime: z.string(), language: z.enum(["en", "de"]), bytes: z.number() }).parse(job.output);
      const { data: audio, error } = await client.storage.from(AUDIO_BUCKET).download(job.audio_path);
      databaseError(error);
      if (!audio || audio.size > PERSONAL_LIMITS.audioBytes || audio.size !== metadata.bytes) throw new ChapterHttpError(400, "The uploaded recording does not match the selected file.");
      const bytes = new Uint8Array(await audio.arrayBuffer());
      const information = await parseBuffer(bytes, { mimeType: metadata.mime, size: bytes.length }, { duration: true });
      const duration = information.format.duration;
      if (!duration || !Number.isFinite(duration) || duration > PERSONAL_LIMITS.audioSeconds + 1) throw new ChapterHttpError(400, "Choose a readable audio clip no longer than three minutes.");
      const result = await createChapterAI(process.env.GROQ_API_KEY!).transcribe(new File([bytes], `recording.${AUDIO_TYPES[metadata.mime]}`, { type: metadata.mime }), metadata.language);
      const saved = await client.from("personal_chapter_jobs").update({ status: "complete", output: result }).eq("id", job.id).eq("user_id", userId).eq("status", "processing").select("id").maybeSingle();
      databaseError(saved.error);
      if (!saved.data) throw new ChapterHttpError(409, "Recording was cancelled.");
      return result;
    } catch (error) {
      await client.from("personal_chapter_jobs").update({ status: "failed", output: null }).eq("id", job.id).eq("user_id", userId).eq("status", "processing");
      providerFailure(error);
    } finally {
      await client.storage.from(AUDIO_BUCKET).remove([job.audio_path]);
    }
  }

  if (operation.op === "generate") {
    await reserve(client, userId, operation.requestId, "generate", operation.input);
    const job = await ownedJob(client, userId, operation.requestId);
    const previous = await client.from("personal_chapters").select("id").eq("id", job.id).eq("user_id", userId).maybeSingle();
    databaseError(previous.error);
    if (previous.data) return { id: job.id };
    await claim(client, userId, job.id, "ready");
    try {
      const count = await client.from("personal_chapters").select("id", { count: "exact", head: true }).eq("user_id", userId);
      databaseError(count.error);
      if ((count.count ?? 0) >= 100) throw new ChapterHttpError(409, "Your library holds 100 chapters. Export and delete a chapter before adding another.");
      const result = await createChapterAI(process.env.GROQ_API_KEY!).generate(operation.input);
      const inserted = await client.from("personal_chapters").insert({ id: job.id, user_id: userId, blueprint: result.blueprint as unknown as Json });
      databaseError(inserted.error);
      await client.from("personal_chapter_jobs").update({ status: "complete", output: result.metrics }).eq("id", job.id).eq("user_id", userId);
      if (operation.uploadId) await clearAudio(client, userId, operation.uploadId).catch(() => undefined);
      return { id: job.id, metrics: result.metrics };
    } catch (error) {
      await client.from("personal_chapter_jobs").update({ status: "failed" }).eq("id", job.id).eq("user_id", userId).eq("status", "processing");
      providerFailure(error);
    }
  }

  const chapter = await ownedChapter(client, userId, operation.id);
  if (operation.op === "delete") {
    const result = await client.from("personal_chapters").delete().eq("id", chapter.id).eq("user_id", userId);
    databaseError(result.error);
    return { ok: true };
  }
  if (operation.op === "progress") {
    const total = chapter.blueprint[operation.variant].turns.length;
    if (operation.progress.index > total || operation.progress.completed !== (operation.progress.index === total)) throw new ChapterHttpError(400, "Invalid chapter checkpoint.");
    const result = await client.from("personal_chapter_progress").upsert({ chapter_id: chapter.id, user_id: userId, variant: operation.variant, turn_index: operation.progress.index, correct: operation.progress.correct, completed: operation.progress.completed, updated_at: new Date().toISOString() }, { onConflict: "chapter_id,variant" });
    databaseError(result.error);
    return { ok: true };
  }
  if (!chapter.blueprint.targets[operation.index]) throw new ChapterHttpError(404, "Learning target not found.");
  if (operation.op === "addReview") {
    const result = await client.from("personal_chapter_reviews").upsert({ chapter_id: chapter.id, user_id: userId, target_index: operation.index }, { onConflict: "chapter_id,target_index", ignoreDuplicates: true });
    databaseError(result.error);
    return { ok: true };
  }
  const review = await client.from("personal_chapter_reviews").select("*").eq("chapter_id", chapter.id).eq("user_id", userId).eq("target_index", operation.index).maybeSingle();
  databaseError(review.error);
  if (!review.data) throw new ChapterHttpError(404, "Review item not found.");
  const next = schedule({ easeFactor: Number(review.data.ease_factor), intervalDays: review.data.interval_days, repetitions: review.data.repetitions }, operation.grade);
  const result = await client.from("personal_chapter_reviews").update({ ease_factor: next.easeFactor, interval_days: next.intervalDays, repetitions: next.repetitions, due_at: next.dueAt.toISOString(), updated_at: new Date().toISOString() }).eq("chapter_id", chapter.id).eq("user_id", userId).eq("target_index", operation.index).eq("updated_at", operation.revision).select("chapter_id").maybeSingle();
  databaseError(result.error);
  if (!result.data) throw new ChapterHttpError(409, "This review was already updated. Refresh to continue.");
  return { ok: true };
}