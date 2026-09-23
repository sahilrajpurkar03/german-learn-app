"use client";

import { useMemo, useState } from "react";
import { Search, Volume2 } from "lucide-react";
import type { Gender } from "@/lib/course/types";
import { playGerman } from "@/features/player/audio";
import { GermanWord } from "@/features/player/exercises/shared";

export type WordEntry = { key: string; de: string; en: string; gender?: Gender; strength: number | null; due?: string | null };

function strengthLabel(strength: number | null) {
  if (strength === null) return "Not learned yet";
  if (strength < 0.2) return "New";
  if (strength < 0.5) return "Getting there";
  if (strength < 0.8) return "Strong";
  return "Mastered";
}

export function WordList({ items, searchable = false }: { items: WordEntry[]; searchable?: boolean }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("de");
    return search ? items.filter((item) => `${item.de} ${item.en}`.toLocaleLowerCase("de").includes(search)) : items;
  }, [items, query]);
  return (
    <div>
      {searchable && (
        <label className="mb-4 flex items-center gap-2 rounded-2xl border-2 border-line bg-surface px-4 focus-within:border-brand">
          <Search size={18} className="text-ink-soft" aria-hidden="true" />
          <span className="sr-only">Search your words</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search German or English…" className="min-h-12 flex-1 bg-transparent text-base outline-none" />
        </label>
      )}
      {shown.length === 0 ? <p className="rounded-2xl bg-surface p-5 text-center text-ink-soft">Nothing here yet.</p> : (
        <ul className="divide-y-2 divide-line overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-card)]">
          {shown.map((item) => (
            <li key={item.key} className="flex items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => playGerman(item.de)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand" aria-label={`Hear ${item.de}`}><Volume2 size={17} aria-hidden="true" /></button>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold"><GermanWord de={item.de} gender={item.gender} /></span>
                <span className="block text-sm text-ink-soft">{item.en}</span>
              </span>
              <span className="flex w-24 shrink-0 flex-col items-end gap-1">
                <span className="flex gap-0.5" aria-label={`Memory strength: ${strengthLabel(item.strength)}`}>
                  {[0.01, 0.2, 0.5, 0.8].map((threshold) => (
                    <span key={threshold} className={`h-2.5 w-4 rounded-full ${item.strength !== null && item.strength >= threshold ? (item.strength >= 0.8 ? "bg-success" : "bg-gold") : "bg-surface-2"}`} />
                  ))}
                </span>
                <span className="text-[11px] font-semibold text-ink-soft">{strengthLabel(item.strength)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
