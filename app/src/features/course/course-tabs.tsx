"use client";

import { useEffect, useState, type ReactNode } from "react";

const TABS = ["chapters", "custom", "vocabulary", "sentences"] as const;

type TabId = (typeof TABS)[number];

function isTabId(value: string | null): value is TabId {
  return (TABS as readonly string[]).includes(value ?? "");
}

/** One page, four sections. Which one shows is picked from the nav bar's own "Course" popup
 * (see ui/tab-bar.tsx) via ?tab=, so this component only needs to read that and switch panels —
 * no second switcher duplicating that choice on the page itself. */
export function CourseTabs({ chapters, custom, vocabulary, sentences }: { chapters: ReactNode; custom: ReactNode; vocabulary: ReactNode; sentences: ReactNode }) {
  const [active, setActive] = useState<TabId>("chapters");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (isTabId(requested) && requested !== "chapters") queueMicrotask(() => setActive(requested));
  }, []);

  const panels: Record<TabId, ReactNode> = { chapters, custom, vocabulary, sentences };
  return (
    <div>
      {TABS.map((tab) => (
        <div key={tab} hidden={active !== tab}>
          {panels[tab]}
        </div>
      ))}
    </div>
  );
}
