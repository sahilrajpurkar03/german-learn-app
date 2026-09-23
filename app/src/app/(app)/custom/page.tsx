import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSnapshot } from "@/lib/learning/guard";
import { CustomLibrary } from "@/features/custom/custom-library";

export const metadata: Metadata = { title: "Custom lessons · Sprechen" };

export default async function CustomPage() {
  const { snapshot } = await requireSnapshot();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <Link href="/course" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand"><ArrowLeft size={16} aria-hidden="true" />Course</Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Custom lessons <span className="align-middle text-sm font-bold text-gold">beta</span></h1>
      <p className="mb-6 mt-1 text-ink-soft">Lessons made from situations in your own life.</p>
      <CustomLibrary inReview={snapshot.memory.filter((state) => state.key.startsWith("c.")).map((state) => state.key)} />
    </main>
  );
}
