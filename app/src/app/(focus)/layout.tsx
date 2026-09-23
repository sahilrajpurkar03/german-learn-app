import { requireLearner } from "@/lib/learning/guard";
import { MotionProvider } from "@/ui/motion";
import { ThemeScript } from "@/ui/theme-script";

// Full-screen layout for lessons, reviews and onboarding: no tab bar, nothing to distract.
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  await requireLearner();
  return (
    <div className="v2 v2-focus flex min-h-dvh flex-1 flex-col">
      <ThemeScript />
      <MotionProvider>{children}</MotionProvider>
    </div>
  );
}
