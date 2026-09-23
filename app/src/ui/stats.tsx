"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

export function Flame({ active, size = 26 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={active ? "v2-flame" : "opacity-40 grayscale"}>
      <path d="M12 2c.6 3.2-1.4 4.9-2.9 6.6C7.6 10.3 6 12.1 6 14.8 6 18.8 8.7 22 12 22s6-3 6-7c0-2.4-1-4.3-2.4-5.8.1 1.5-.4 2.8-1.6 3.4.3-3.7-.6-7.8-2-10.6Z" fill="url(#flame-outer)" />
      <path d="M12 22c-1.9 0-3.4-1.6-3.4-3.8 0-1.9 1.3-3 2.2-4 .4 1.4 1.3 1.9 2 1.9-.2-1.3.3-2.5 1-3.2.9 1.1 1.6 2.6 1.6 4.4 0 2.6-1.5 4.7-3.4 4.7Z" fill="#ffe08a" />
      <defs>
        <linearGradient id="flame-outer" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb13b" />
          <stop offset="1" stopColor="#e2551f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StreakBadge({ days, compact = false }: { days: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 font-bold tabular text-ink" aria-label={`${days}-day streak`} title={`${days}-day streak`}>
      <Flame active={days > 0} size={compact ? 22 : 26} />
      <span className={compact ? "text-base" : "text-lg"}>{days}</span>
    </span>
  );
}

/** Counts up to the new value instead of jumping. */
export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) { node.textContent = String(value); previous.current = value; return; }
    const controls = animate(previous.current, value, { duration: 0.8, ease: "easeOut", onUpdate: (latest) => { node.textContent = String(Math.round(latest)); } });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return <span ref={ref} className={`tabular ${className}`}>{value}</span>;
}
