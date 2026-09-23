import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSnapshot } from "@/lib/learning/guard";
import { customResolver, describe } from "@/lib/learning/items";
import { WordList, type WordEntry } from "@/features/course/word-list";

export const metadata: Metadata = { title: "My words · Sprechen" };

export default async function WordsPage() {
  const { client, user, snapshot } = await requireSnapshot();
  const custom = await customResolver(client, user.id, snapshot.memory.map((state) => state.key));
  const entries: WordEntry[] = snapshot.memory
    .sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt))
    .flatMap((state) => {
      const info = describe(state.key, custom);
      return info ? [{ key: state.key, de: info.de, en: info.en, gender: info.gender, strength: state.strength, due: state.dueAt }] : [];
    });
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <Link href="/review" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand"><ArrowLeft size={16} aria-hidden="true" />Review</Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">My words</h1>
      <p className="mb-5 mt-1 text-ink-soft">{entries.length} words, phrases and patterns you&apos;ve met. Tap to hear them.</p>
      <WordList items={entries} searchable />
    </main>
  );
}
