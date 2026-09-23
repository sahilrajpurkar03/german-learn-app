"use client";

import { m } from "motion/react";
import { hash } from "@/lib/course/random";

export type PartnerMood = "idle" | "speaking" | "listening" | "happy" | "thinking";

const SKIN = ["#f1c7a5", "#d9a47f", "#b97d57", "#8d5a3b", "#f5d4bb"];
const HAIR = ["#2b1d16", "#5a3a22", "#9a6a3a", "#1c1c24", "#c7923f"];
// Rough look from the name the course gives each partner (Frau …, Anna, Mila …); anything else varies by name.
const LONG = /^(Frau|Anna|Mila|Lena|Sofia|Maria|Priya|Sarah|Laura|Emma|Lea)/i;
const SHORT = /^(Herr|Tom|Jonas|Paul|Max|Ben|Lukas|Ravi|Sam)/i;
const TOP = ["#1f4e8c", "#b93d28", "#1b7f53", "#a8741f", "#6b4fa0"];

/** A friendly conversation partner drawn in SVG. Mood drives small, readable motions; all of it stops under reduced motion. */
export function Partner({ name, mood, size = 132 }: { name: string; mood: PartnerMood; size?: number }) {
  const seed = hash(name);
  const skin = SKIN[seed % SKIN.length];
  const hair = HAIR[(seed >> 3) % HAIR.length];
  const top = TOP[(seed >> 6) % TOP.length];
  const longHair = LONG.test(name) ? true : SHORT.test(name) ? false : seed % 2 === 0;
  const head = mood === "listening" ? { rotate: -7, y: 0 } : mood === "thinking" ? { rotate: 5, y: 1 } : mood === "happy" ? { rotate: 0, y: [0, -7, 0, -4, 0] } : { rotate: 0, y: 0 };
  return (
    <div role="img" aria-label={`${name}, ${mood === "idle" ? "waiting for you" : mood}`} data-mood={mood} className="partner relative select-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <ellipse cx="60" cy="114" rx="34" ry="4" fill="black" opacity="0.08" />
        <m.g animate={{ scaleY: [1, 1.015, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "60px", originY: "112px" }}>
          <path d="M22 118c0-22 16-34 38-34s38 12 38 34Z" fill={top} />
          <path d="M50 86c2 6 18 6 20 0l-2 8H52Z" fill="white" opacity="0.25" />
          <rect x="53" y="72" width="14" height="14" rx="6" fill={skin} />
          <m.g animate={head} transition={mood === "happy" ? { duration: 0.8 } : { type: "spring", stiffness: 180, damping: 14 }} style={{ originX: "60px", originY: "80px" }}>
            {longHair && <path d="M30 50c0-22 12-34 30-34s30 12 30 34v26c0 6-6 8-10 6V48H40v34c-4 2-10 0-10-6Z" fill={hair} />}
            <ellipse cx="33" cy="54" rx="5" ry="7" fill={skin} />
            <ellipse cx="87" cy="54" rx="5" ry="7" fill={skin} />
            <rect x="34" y="24" width="52" height="56" rx="26" fill={skin} />
            <path d={longHair ? "M34 44c2-16 12-24 26-24s24 8 26 24c-8-8-18-10-26-6-8-4-18-2-26 6Z" : "M33 46c0-18 12-26 27-26s27 8 27 26c-6-6-12-10-20-9 2-4 0-7-3-8-4 5-15 9-31 17Z"} fill={hair} />
            <m.path d="M44 45q5-3 10 0" stroke={hair} strokeWidth="2.6" strokeLinecap="round" fill="none" animate={{ y: mood === "thinking" ? -2 : mood === "happy" ? -1.5 : 0 }} />
            <m.path d="M66 45q5-3 10 0" stroke={hair} strokeWidth="2.6" strokeLinecap="round" fill="none" animate={{ y: mood === "listening" || mood === "thinking" ? -3 : mood === "happy" ? -1.5 : 0 }} />
            <m.g animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4.2, times: [0, 0.92, 0.95, 1], repeat: Infinity }} style={{ originX: "60px", originY: "54px" }}>
              {mood === "happy" ? (
                <>
                  <path d="M45 55q4-5 8 0" stroke="#1d2433" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                  <path d="M67 55q4-5 8 0" stroke="#1d2433" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  <circle cx="49" cy="54" r="3.4" fill="#1d2433" />
                  <circle cx="71" cy="54" r="3.4" fill="#1d2433" />
                  <circle cx="50.2" cy="52.8" r="1" fill="white" />
                  <circle cx="72.2" cy="52.8" r="1" fill="white" />
                </>
              )}
            </m.g>
            <path d="M59 58q-2 6 2 7" stroke="black" strokeOpacity="0.18" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <circle cx="42" cy="64" r="4" fill="#e9776a" opacity={mood === "happy" ? 0.45 : 0.22} />
            <circle cx="78" cy="64" r="4" fill="#e9776a" opacity={mood === "happy" ? 0.45 : 0.22} />
            {mood === "speaking" ? (
              <m.ellipse cx="60" cy="69" rx="6" fill="#7a2f2a" animate={{ ry: [1.5, 4.5, 2, 5, 1.5] }} transition={{ duration: 0.55, repeat: Infinity }} />
            ) : mood === "happy" ? (
              <path d="M51 67q9 9 18 0Z" fill="#7a2f2a" />
            ) : mood === "thinking" ? (
              <path d="M54 70q6-2 12 1" stroke="#7a2f2a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M53 68q7 5 14 0" stroke="#7a2f2a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            )}
          </m.g>
          <m.g animate={mood === "happy" ? { rotate: [0, -18, 6, -12, 0] } : mood === "speaking" ? { rotate: [0, -6, 0] } : { rotate: 0 }} transition={{ duration: mood === "speaking" ? 1.4 : 0.9, repeat: mood === "speaking" ? Infinity : 0 }} style={{ originX: "92px", originY: "98px" }}>
            <path d="M88 98c6-8 10-18 12-26" stroke={top} strokeWidth="9" strokeLinecap="round" fill="none" opacity={mood === "happy" || mood === "speaking" ? 1 : 0} />
            <circle cx="100" cy="70" r="5.5" fill={skin} opacity={mood === "happy" || mood === "speaking" ? 1 : 0} />
          </m.g>
        </m.g>
      </svg>
      {mood === "listening" && (
        <m.span className="absolute -right-1 top-3 grid h-8 w-8 place-items-center rounded-full bg-brand text-on-brand text-sm shadow" initial={{ scale: 0 }} animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.2, repeat: Infinity }} aria-hidden="true">🎤</m.span>
      )}
      {mood === "thinking" && (
        <m.span className="absolute -right-1 top-2 text-2xl" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} aria-hidden="true">💭</m.span>
      )}
    </div>
  );
}
