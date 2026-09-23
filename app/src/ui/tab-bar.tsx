"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { Brain, House, Map, UserRound } from "lucide-react";
import { Logo } from "./logo";

const TABS = [
  { href: "/today", label: "Today", icon: House },
  { href: "/course", label: "Course", icon: Map },
  { href: "/review", label: "Review", icon: Brain },
  { href: "/me", label: "Me", icon: UserRound },
] as const;

export function TabBar({ due }: { due: number }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(`${href}/`) || (href === "/course" && path.startsWith("/custom"));
  return (
    <>
      <nav aria-label="Main" className="v2-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={active(href) ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 pb-1 pt-2 text-xs font-semibold ${active(href) ? "text-brand" : "text-ink-soft"}`}>
                {active(href) && <m.span layoutId="tab-pill" className="absolute inset-x-5 top-1 h-9 rounded-full bg-brand-soft" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                <span className="relative"><Icon size={24} strokeWidth={active(href) ? 2.5 : 2} aria-hidden="true" />{href === "/review" && due > 0 && <Badge count={due} />}</span>
                <span className="relative">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Main" className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-2 border-r-2 border-line bg-surface px-4 py-6 md:flex">
        <Link href="/today" className="mb-6 px-2"><Logo /></Link>
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${active(href) ? "text-brand" : "text-ink-soft hover:bg-surface-2"}`}>
            {active(href) && <m.span layoutId="rail-pill" className="absolute inset-0 rounded-2xl border-2 border-brand/40 bg-brand-soft" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative"><Icon size={24} aria-hidden="true" />{href === "/review" && due > 0 && <Badge count={due} />}</span>
            <span className="relative">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function Badge({ count }: { count: number }) {
  return <span className="absolute -right-2.5 -top-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-5 text-white" aria-label={`${count} due`}>{count > 99 ? "99+" : count}</span>;
}
