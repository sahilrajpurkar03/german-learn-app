"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Brain, Check, House, Map, UserRound } from "lucide-react";
import { Logo } from "./logo";

const TABS = [
  { href: "/today", label: "Today", icon: House },
  { href: "/course", label: "Course", icon: Map },
  { href: "/review", label: "Review", icon: Brain },
  { href: "/me", label: "Me", icon: UserRound },
] as const;

const COURSE_SECTIONS = [
  { id: "chapters", label: "Chapters" },
  { id: "custom", label: "Custom" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "sentences", label: "Sentences" },
] as const;

export function TabBar({ due }: { due: number }) {
  const pathname = usePathname();
  const router = useRouter();
  // Highlight the tapped tab straight away, before the next page has arrived. The tap only counts while
  // we are still on the page it was made from, so it can never leave a wrong tab highlighted.
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  const [courseMenu, setCourseMenu] = useState<"mobile" | "desktop" | null>(null);
  const mobileMenuRef = useRef<HTMLLIElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const path = tapped && tapped.from === pathname ? tapped.href : pathname;
  const active = (href: string) => path === href || path.startsWith(`${href}/`) || (href === "/course" && path.startsWith("/custom"));
  const tap = (href: string) => () => { if (href !== pathname) setTapped({ href, from: pathname }); };

  useEffect(() => {
    if (!courseMenu) return;
    const activeRef = courseMenu === "mobile" ? mobileMenuRef : desktopMenuRef;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setCourseMenu(null); }
    function onClick(event: MouseEvent) { if (activeRef.current && !activeRef.current.contains(event.target as Node)) setCourseMenu(null); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onClick); };
  }, [courseMenu]);

  function openCourse(from: "mobile" | "desktop") {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      setCourseMenu((current) => (current === from ? null : from));
    };
  }

  function goToSection(section: (typeof COURSE_SECTIONS)[number]["id"]) {
    setCourseMenu(null);
    setTapped({ href: "/course", from: pathname });
    router.push(section === "chapters" ? "/course" : `/course?tab=${section}`);
  }

  const courseMenuList = (placement: "up" | "right") => (
    <m.div role="menu" aria-label="Course sections" initial={{ opacity: 0, scale: 0.96, y: placement === "up" ? 4 : -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      className={`absolute z-40 w-44 overflow-hidden rounded-2xl border-2 border-line bg-surface p-1 shadow-[var(--shadow-lift)] ${placement === "up" ? "bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2" : "left-[calc(100%+0.5rem)] top-0"}`}>
      {COURSE_SECTIONS.map((section) => {
        const isActive = active("/course") && new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("tab") === (section.id === "chapters" ? null : section.id);
        return (
          <button key={section.id} type="button" role="menuitemradio" aria-checked={isActive} onClick={() => goToSection(section.id)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold ${isActive ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface-2"}`}>
            {section.label}
            {isActive && <Check size={16} aria-hidden="true" />}
          </button>
        );
      })}
    </m.div>
  );

  return (
    <>
      <nav aria-label="Main" className="v2-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => (
            <li key={href} className={href === "/course" ? "relative" : undefined} ref={href === "/course" ? mobileMenuRef : undefined}>
              <Link href={href} onClick={href === "/course" ? openCourse("mobile") : tap(href)} aria-haspopup={href === "/course" ? "menu" : undefined} aria-expanded={href === "/course" ? courseMenu === "mobile" : undefined}
                aria-current={active(href) ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 pb-1 pt-2 text-xs font-semibold ${active(href) ? "text-brand" : "text-ink-soft"}`}>
                {active(href) && <m.span layoutId="tab-pill" className="absolute inset-x-5 top-1 h-9 rounded-full bg-brand-soft" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                <span className="relative"><Icon size={24} strokeWidth={active(href) ? 2.5 : 2} aria-hidden="true" />{href === "/review" && due > 0 && <Badge count={due} />}</span>
                <span className="relative">{label}</span>
              </Link>
              <AnimatePresence>{href === "/course" && courseMenu === "mobile" && courseMenuList("up")}</AnimatePresence>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Main" className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-2 border-r-2 border-line bg-surface px-4 py-6 md:flex">
        <Link href="/today" className="mb-6 px-2"><Logo /></Link>
        {TABS.map(({ href, label, icon: Icon }) => (
          <div key={href} className={href === "/course" ? "relative" : undefined} ref={href === "/course" ? desktopMenuRef : undefined}>
            <Link href={href} onClick={href === "/course" ? openCourse("desktop") : tap(href)} aria-haspopup={href === "/course" ? "menu" : undefined} aria-expanded={href === "/course" ? courseMenu === "desktop" : undefined}
              aria-current={active(href) ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${active(href) ? "text-brand" : "text-ink-soft hover:bg-surface-2"}`}>
              {active(href) && <m.span layoutId="rail-pill" className="absolute inset-0 rounded-2xl border-2 border-brand/40 bg-brand-soft" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <span className="relative"><Icon size={24} aria-hidden="true" />{href === "/review" && due > 0 && <Badge count={due} />}</span>
              <span className="relative">{label}</span>
            </Link>
            <AnimatePresence>{href === "/course" && courseMenu === "desktop" && courseMenuList("right")}</AnimatePresence>
          </div>
        ))}
      </nav>
    </>
  );
}

function Badge({ count }: { count: number }) {
  return <span className="absolute -right-2.5 -top-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-5 text-white" aria-label={`${count} due`}>{count > 99 ? "99+" : count}</span>;
}
