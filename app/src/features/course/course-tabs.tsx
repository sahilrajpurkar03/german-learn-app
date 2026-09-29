"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const TABS = ["chapters", "custom", "vocabulary", "sentences"] as const;

type TabId = (typeof TABS)[number];

function isTabId(value: string | null): value is TabId {
  return (TABS as readonly string[]).includes(value ?? "");
}

/** One page, four sections. Which one shows is picked from the nav bar's own "Course" popup
 * (see ui/tab-bar.tsx) via ?tab=, so this component only needs to read that and switch panels —
 * no second switcher duplicating that choice on the page itself. useSearchParams (not a one-time
 * read of window.location) so switching sections while already on /course updates immediately,
 * instead of only taking effect after a visit to another tab remounts this component. */
export function CourseTabs({ chapters, custom, vocabulary, sentences }: { chapters: ReactNode; custom: ReactNode; vocabulary: ReactNode; sentences: ReactNode }) {
  const requested = useSearchParams().get("tab");
  const active: TabId = isTabId(requested) ? requested : "chapters";
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
