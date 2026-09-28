"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

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

/** One page, four sections, switched by a small dropdown next to the title — not a row of
 * tabs sitting on screen all the time. Picking a section closes the menu straight away. */
export function CourseTabs({ chapters, custom, vocabulary, sentences }: { chapters: ReactNode; custom: ReactNode; vocabulary: ReactNode; sentences: ReactNode }) {
  const [active, setActive] = useState<TabId>("chapters");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reads the initial tab from ?tab= without a server round-trip or router navigation. The
  // server always renders "chapters" first (no window), so this corrects it once on mount
  // rather than in the initializer, to avoid a hydration mismatch.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (isTabId(requested) && requested !== "chapters") queueMicrotask(() => setActive(requested));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    function onClick(event: MouseEvent) { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onClick); };
  }, [open]);

  function select(tab: TabId) {
    setActive(tab);
    setOpen(false);
    const url = new URL(window.location.href);
    if (tab === "chapters") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url);
  }

  const panels: Record<TabId, ReactNode> = { chapters, custom, vocabulary, sentences };
  const current = TABS.find((tab) => tab.id === active)!;

  return (
    <div>
      <div ref={menuRef} className="relative inline-block">
        <button type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 py-1.5 pl-3.5 pr-2.5 text-sm font-bold text-ink hover:bg-surface-2/70">
          {current.label}
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        <AnimatePresence>
          {open && (
            <m.div role="menu" aria-label="Course sections" initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }} className="absolute left-0 top-[calc(100%+0.375rem)] z-20 w-48 overflow-hidden rounded-2xl border-2 border-line bg-surface p-1 shadow-[var(--shadow-lift)]">
              {TABS.map((tab) => (
                <button key={tab.id} type="button" role="menuitemradio" aria-checked={active === tab.id} onClick={() => select(tab.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold ${active === tab.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface-2"}`}>
                  {tab.label}
                  {active === tab.id && <Check size={16} aria-hidden="true" />}
                </button>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </div>
      {TABS.map((tab) => (
        <div key={tab.id} hidden={active !== tab.id} className="mt-5">
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
