import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";
import { chapterBlueprintSchema } from "../personal-chapters";
import { getItem, getPattern } from "../course/catalog";
import { customItems, parseCustomItemKey } from "../course/custom";
import type { Item } from "../course/types";

/** Resolve memory keys to something showable, including the learner's own custom-lesson targets. */
export async function customResolver(client: SupabaseClient<Database>, userId: string, keys: string[]) {
  const ids = [...new Set(keys.map((key) => parseCustomItemKey(key)?.chapterId).filter((id): id is string => Boolean(id)))];
  const pools = new Map<string, Item[]>();
  if (ids.length) {
    const { data } = await client.from("personal_chapters").select("id, blueprint").eq("user_id", userId).in("id", ids);
    for (const row of data ?? []) {
      const parsed = chapterBlueprintSchema.safeParse(row.blueprint);
      if (parsed.success) pools.set(row.id, customItems(row.id, parsed.data));
    }
  }
  return (key: string): { item: Item; pool: Item[] } | null => {
    const parsed = parseCustomItemKey(key);
    const pool = parsed && pools.get(parsed.chapterId);
    const item = pool?.[parsed!.index];
    return item && pool ? { item, pool } : null;
  };
}

export function describe(key: string, custom: (key: string) => { item: Item } | null): { de: string; en: string; gender?: Item["gender"]; kind: string } | null {
  const item = getItem(key) ?? custom(key)?.item;
  if (item) return { de: item.de, en: item.en, gender: item.gender, kind: key.startsWith("c.") ? "Custom" : key.startsWith("t.") ? "Conversation" : item.kind === "word" ? "Word" : "Phrase" };
  const pattern = getPattern(key);
  return pattern ? { de: pattern.title, en: "Grammar pattern", kind: "Grammar" } : null;
}
