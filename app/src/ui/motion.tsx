"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";

/** Loads Motion's lightweight feature set once; honours the OS "reduce motion" setting everywhere. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 32 }}>{children}</MotionConfig>
    </LazyMotion>
  );
}

export const spring = { type: "spring", stiffness: 420, damping: 32 } as const;
export const softSpring = { type: "spring", stiffness: 220, damping: 26 } as const;
