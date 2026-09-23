"use client";

import { m } from "motion/react";
import { softSpring } from "./motion";

export function ProgressBar({ value, max = 1, label, tone = "brand", className = "" }: { value: number; max?: number; label: string; tone?: "brand" | "gold" | "success"; className?: string }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const color = tone === "gold" ? "bg-gold" : tone === "success" ? "bg-success" : "bg-brand";
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className={`h-3 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <m.div className={`h-full rounded-full ${color} relative`} initial={false} animate={{ width: `${ratio * 100}%` }} transition={softSpring}>
        <span className="absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-white/35" />
      </m.div>
    </div>
  );
}

export function ProgressRing({ value, max, size = 64, stroke = 7, label, children, tone = "gold" }: { value: number; max: number; size?: number; stroke?: number; label: string; children?: React.ReactNode; tone?: "gold" | "brand" | "success" }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const radius = (size - stroke) / 2;
  const color = tone === "success" ? "var(--v2-success)" : tone === "brand" ? "var(--v2-brand)" : "var(--v2-gold)";
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--v2-surface-2)" strokeWidth={stroke} />
        <m.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={false} animate={{ pathLength: ratio }} transition={softSpring} style={{ pathLength: ratio }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
