"use client";

import Link from "next/link";
import { m } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger" | "gold";
type Size = "lg" | "md" | "sm";

const base = "relative inline-flex items-center justify-center gap-2 font-semibold select-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-center leading-tight";
const sizes: Record<Size, string> = {
  lg: "min-h-14 px-6 text-lg rounded-2xl w-full",
  md: "min-h-12 px-5 text-base rounded-xl",
  sm: "min-h-10 px-3.5 text-sm rounded-lg",
};
const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand shadow-[0_4px_0_var(--v2-brand-strong)] hover:brightness-105 active:shadow-none active:translate-y-1",
  gold: "bg-gold text-white shadow-[0_4px_0_color-mix(in_oklab,var(--v2-gold)_70%,black)] hover:brightness-105 active:shadow-none active:translate-y-1",
  success: "bg-success text-white shadow-[0_4px_0_color-mix(in_oklab,var(--v2-success)_70%,black)] active:shadow-none active:translate-y-1",
  danger: "bg-danger text-white shadow-[0_4px_0_color-mix(in_oklab,var(--v2-danger)_70%,black)] active:shadow-none active:translate-y-1",
  secondary: "bg-surface text-ink border-2 border-line shadow-[0_3px_0_var(--v2-line)] hover:bg-surface-2 active:shadow-none active:translate-y-[3px]",
  ghost: "bg-transparent text-brand hover:bg-brand-soft",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`;
}

type ButtonProps = Omit<ComponentProps<typeof m.button>, "children"> & { variant?: Variant; size?: Size; children: ReactNode };

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <m.button whileTap={props.disabled ? undefined : { scale: 0.97 }} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </m.button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
