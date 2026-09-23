import { createClient } from "@/lib/supabase/server";
import type { ItemType, Level } from "@/lib/supabase/database.types";

export type ExerciseKind = "mcq" | "listen_type" | "word_bank" | "speak";

export interface VocabSessionItem {
  itemType: "vocab";
  id: string;
  exercise: ExerciseKind;
  lemma: string;
  translationEn: string;
  exampleDe: string | null;
  exampleEn: string | null;
  options?: string[]; // for mcq
}

export interface PhraseSessionItem {
  itemType: "phrase";
  id: string;
  exercise: ExerciseKind;
  deText: string;
  enText: string;
  situation: string | null;
}

export type SessionItem = VocabSessionItem | PhraseSessionItem;

const SESSION_SIZE = 12;
const DUE_RATIO = 0.7; // prioritise items due for review over brand-new ones
const LEVELS: Level[] = ["a1", "a2", "b1"];

// content isn't gated to a single level bucket: everything up to the learner's
// placement level is in play, so practice feels like real-life German, not a course ladder
function unlockedLevels(level: Level): Level[] {
  const idx = LEVELS.indexOf(level);
  return LEVELS.slice(0, idx + 1);
}

function pickExerciseForVocab(): ExerciseKind {
  return Math.random() < 0.6 ? "mcq" : "listen_type";
}

function pickExerciseForPhrase(): ExerciseKind {
  const roll = Math.random();
  if (roll < 0.4) return "word_bank";
  if (roll < 0.75) return "speak";
  return "listen_type";
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function buildSession(userId: string, level: Level): Promise<SessionItem[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: dueProgress } = await supabase
    .from("item_progress")
    .select("item_type, item_id")
    .eq("user_id", userId)
    .lte("due_at", now)
    .order("due_at", { ascending: true })
    .limit(Math.ceil(SESSION_SIZE * DUE_RATIO));

  const dueVocabIds = (dueProgress ?? []).filter((p) => p.item_type === "vocab").map((p) => p.item_id);
  const duePhraseIds = (dueProgress ?? []).filter((p) => p.item_type === "phrase").map((p) => p.item_id);

  const { data: seenProgress } = await supabase
    .from("item_progress")
    .select("item_type, item_id")
    .eq("user_id", userId);
  const seenVocabIds = new Set((seenProgress ?? []).filter((p) => p.item_type === "vocab").map((p) => p.item_id));
  const seenPhraseIds = new Set((seenProgress ?? []).filter((p) => p.item_type === "phrase").map((p) => p.item_id));

  const remaining = Math.max(0, SESSION_SIZE - dueVocabIds.length - duePhraseIds.length);

  const [dueVocabRows, duePhraseRows, newVocabRows, newPhraseRows, allVocabForOptions] = await Promise.all([
    dueVocabIds.length
      ? supabase.from("vocab_items").select("*").in("id", dueVocabIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    duePhraseIds.length
      ? supabase.from("phrases").select("*").in("id", duePhraseIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    supabase.from("vocab_items").select("*").in("level", unlockedLevels(level)).limit(50),
    supabase.from("phrases").select("*").in("level", unlockedLevels(level)).limit(50),
    supabase.from("vocab_items").select("id, translation_en").in("level", unlockedLevels(level)).limit(100),
  ]);

  const newVocab = (newVocabRows.data ?? []).filter((v) => !seenVocabIds.has(v.id as string));
  const newPhrases = (newPhraseRows.data ?? []).filter((p) => !seenPhraseIds.has(p.id as string));

  const pickedNewVocab = shuffle(newVocab).slice(0, Math.ceil(remaining / 2));
  const pickedNewPhrases = shuffle(newPhrases).slice(0, Math.floor(remaining / 2));

  const distractorPool = (allVocabForOptions.data ?? []).map((v) => v.translation_en as string);

  type VocabRow = { id: string; lemma: string; translation_en: string; example_de: string | null; example_en: string | null };
  type PhraseRow = { id: string; de_text: string; en_text: string; situation: string | null };

  const vocabItems: VocabSessionItem[] = [...(dueVocabRows.data ?? []), ...pickedNewVocab].map((row) => {
    const v = row as VocabRow;
    const exercise = pickExerciseForVocab();
    let options: string[] | undefined;
    if (exercise === "mcq") {
      const distractors = shuffle(distractorPool.filter((t) => t !== v.translation_en)).slice(0, 3);
      options = shuffle([v.translation_en, ...distractors]);
    }
    return {
      itemType: "vocab",
      id: v.id,
      exercise,
      lemma: v.lemma,
      translationEn: v.translation_en,
      exampleDe: v.example_de,
      exampleEn: v.example_en,
      options,
    };
  });

  const phraseItems: PhraseSessionItem[] = [...(duePhraseRows.data ?? []), ...pickedNewPhrases].map((row) => {
    const p = row as PhraseRow;
    return {
      itemType: "phrase",
      id: p.id,
      exercise: pickExerciseForPhrase(),
      deText: p.de_text,
      enText: p.en_text,
      situation: p.situation,
    };
  });

  return shuffle([...vocabItems, ...phraseItems]).slice(0, SESSION_SIZE);
}

const CHECKIN_INTERVAL_DAYS = 7;

export function nextCheckinDate(from = new Date()): string {
  return new Date(from.getTime() + CHECKIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export interface DashboardStats {
  displayName: string;
  currentLevel: Level;
  xp: number;
  streakCurrent: number;
  streakLongest: number;
  dailyGoalMinutes: number;
  dueCount: number;
  practicedToday: boolean;
  weakSpots: Array<{ itemType: ItemType; itemId: string; label: string; accuracy: number }>;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { count: dueCount }, { data: weakRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("item_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("due_at", now),
    supabase
      .from("item_progress")
      .select("item_type, item_id, correct_count, wrong_count")
      .eq("user_id", userId)
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(5),
  ]);

  const weakVocabIds = (weakRows ?? []).filter((r) => r.item_type === "vocab").map((r) => r.item_id);
  const weakPhraseIds = (weakRows ?? []).filter((r) => r.item_type === "phrase").map((r) => r.item_id);

  const [{ data: weakVocab }, { data: weakPhrases }] = await Promise.all([
    weakVocabIds.length
      ? supabase.from("vocab_items").select("id, lemma").in("id", weakVocabIds)
      : Promise.resolve({ data: [] as Array<{ id: string; lemma: string }> }),
    weakPhraseIds.length
      ? supabase.from("phrases").select("id, de_text").in("id", weakPhraseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; de_text: string }> }),
  ]);

  const labelById = new Map<string, string>();
  for (const v of weakVocab ?? []) labelById.set(v.id, v.lemma);
  for (const p of weakPhrases ?? []) labelById.set(p.id, p.de_text);

  const weakSpots = (weakRows ?? []).map((r) => ({
    itemType: r.item_type as ItemType,
    itemId: r.item_id,
    label: labelById.get(r.item_id) ?? "?",
    accuracy: r.correct_count + r.wrong_count > 0 ? r.correct_count / (r.correct_count + r.wrong_count) : 0,
  }));

  return {
    displayName: profile?.display_name ?? "Learner",
    currentLevel: (profile?.current_level as Level) ?? "a1",
    xp: profile?.xp ?? 0,
    streakCurrent: profile?.streak_current ?? 0,
    streakLongest: profile?.streak_longest ?? 0,
    dailyGoalMinutes: profile?.daily_goal_minutes ?? 30,
    dueCount: dueCount ?? 0,
    practicedToday: profile?.last_active_date === today,
    weakSpots,
  };
}

export interface ProgressDetails {
  totalSessions: number;
  totalXp: number;
  dailyAccuracy: Array<{ date: string; correct: number; total: number }>;
  weakSpots: Array<{ itemType: ItemType; itemId: string; label: string; accuracy: number; attempts: number }>;
}

export async function getProgressDetails(userId: string): Promise<ProgressDetails> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalSessions }, { data: sessions }, { data: events }, { data: weakRows }] = await Promise.all([
    supabase.from("practice_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("practice_sessions").select("xp_earned").eq("user_id", userId),
    supabase
      .from("session_events")
      .select("created_at, correct")
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase
      .from("item_progress")
      .select("item_type, item_id, correct_count, wrong_count")
      .eq("user_id", userId)
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(10),
  ]);

  const totalXp = (sessions ?? []).reduce((sum, s) => sum + (s.xp_earned ?? 0), 0);

  const byDay = new Map<string, { correct: number; total: number }>();
  for (const e of events ?? []) {
    const day = e.created_at.slice(0, 10);
    const entry = byDay.get(day) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (e.correct) entry.correct += 1;
    byDay.set(day, entry);
  }
  const dailyAccuracy = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const weakVocabIds = (weakRows ?? []).filter((r) => r.item_type === "vocab").map((r) => r.item_id);
  const weakPhraseIds = (weakRows ?? []).filter((r) => r.item_type === "phrase").map((r) => r.item_id);

  const [{ data: weakVocab }, { data: weakPhrases }] = await Promise.all([
    weakVocabIds.length
      ? supabase.from("vocab_items").select("id, lemma").in("id", weakVocabIds)
      : Promise.resolve({ data: [] as Array<{ id: string; lemma: string }> }),
    weakPhraseIds.length
      ? supabase.from("phrases").select("id, de_text").in("id", weakPhraseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; de_text: string }> }),
  ]);

  const labelById = new Map<string, string>();
  for (const v of weakVocab ?? []) labelById.set(v.id, v.lemma);
  for (const p of weakPhrases ?? []) labelById.set(p.id, p.de_text);

  const weakSpots = (weakRows ?? []).map((r) => ({
    itemType: r.item_type as ItemType,
    itemId: r.item_id,
    label: labelById.get(r.item_id) ?? "?",
    accuracy: r.correct_count + r.wrong_count > 0 ? r.correct_count / (r.correct_count + r.wrong_count) : 0,
    attempts: r.correct_count + r.wrong_count,
  }));

  return {
    totalSessions: totalSessions ?? 0,
    totalXp,
    dailyAccuracy,
    weakSpots,
  };
}
