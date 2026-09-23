import type { Metadata } from "next";
import { getItem, getLesson } from "@/lib/course/catalog";
import { MotionProvider } from "@/ui/motion";
import { ThemeScript } from "@/ui/theme-script";
import { Player } from "@/features/player/player";

export const metadata: Metadata = {
  title: "Try a lesson · Sprechen",
  description: "Play the first Sprechen lesson without an account.",
};

// Public taster: the real first lesson, scored on this device only. Nothing is saved.
export default function DemoPage() {
  const lesson = getLesson("a1-u01-l1")!;
  return (
    <div className="v2 v2-focus flex min-h-dvh flex-1 flex-col">
      <ThemeScript />
      <MotionProvider>
        <Player
          mode="demo" lessonId={lesson.id} runId="00000000-0000-4000-8000-000000000000" kind={lesson.kind}
          title={lesson.title} goal="That's how every lesson works: learn, practise, then use it in a real conversation."
          steps={lesson.steps} exitHref="/login" nextHref="/signup"
          learned={lesson.introduces.flatMap((key) => { const item = getItem(key); return item ? [{ de: item.de, en: item.en }] : []; })}
        />
      </MotionProvider>
    </div>
  );
}
