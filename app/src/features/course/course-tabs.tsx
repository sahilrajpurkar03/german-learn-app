"use client";

import { useEffect, useState, type ReactNode } from "react";

const TABS = [
  { id: "chapters", label: "Chapters" },
  { id: "custom", label: "Custom" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "sentences", label: "Sentences" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

/** One page, four sections, switched in place — no route change, no popup. Desktop shows the
 * strip inline above the content; on a phone the same strip just scrolls if it needs to. */
export function CourseTabs({ chapters, custom, vocabulary, sentences }: { chapters: ReactNode; custom: ReactNode; vocabulary: ReactNode; sentences: ReactNode }) {
  const [active, setActive] = useState<TabId>("chapters");

  // Reads the initial tab from ?tab= without a server round-trip or router navigation. The
  // server always renders "chapters" first (no window), so this corrects it once on mount
  // rather than in the initializer, to avoid a hydration mismatch.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (isTabId(requested) && requested !== "chapters") queueMicrotask(() => setActive(requested));
  }, []);

  function select(tab: TabId) {
    setActive(tab);
    const url = new URL(window.location.href);
    if (tab === "chapters") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url);
  }

  const panels: Record<TabId, ReactNode> = { chapters, custom, vocabulary, sentences };

  return (
    <div>
      <div role="tablist" aria-label="Course sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`}
            onClick={() => select(tab.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${active === tab.id ? "bg-brand text-on-brand" : "bg-surface-2 text-ink-soft hover:text-ink"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div key={tab.id} id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={active !== tab.id} className="mt-5">
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
