import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Compass, LogOut } from "lucide-react";
import { displayName, requireSnapshot } from "@/lib/learning/guard";
import { logout } from "@/lib/auth-actions";
import { visibleStreak } from "@/lib/course/activity";
import { SettingsPanel } from "@/features/me/settings-panel";
import { StreakBadge } from "@/ui/stats";

export const metadata: Metadata = { title: "Me · Sprechen" };

export default async function MePage() {
  const { client, user, snapshot } = await requireSnapshot();
  const name = await displayName(client, user.id);
  const lessonsDone = Object.values(snapshot.lessons).filter((lesson) => lesson.status === "completed").length;
  const strong = snapshot.memory.filter((state) => state.strength >= 0.5).length;
  const stats = [
    { label: "Total XP", value: snapshot.stats.xpTotal },
    { label: "Longest streak", value: snapshot.stats.longest },
    { label: "Lessons done", value: lessonsDone },
    { label: "Words learned", value: snapshot.memory.length },
    { label: "Strong in memory", value: strong },
    { label: "Streak freezes", value: snapshot.stats.freezes },
  ];
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <header className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand text-2xl font-bold text-on-brand" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold">{name}</h1>
          <p className="text-ink-soft">{user.email}</p>
        </div>
        <StreakBadge days={visibleStreak(snapshot.stats, snapshot.today)} />
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.label} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <p className="font-display text-3xl font-bold tabular">{stat.value}</p>
            <p className="text-sm text-ink-soft">{stat.label}</p>
          </li>
        ))}
      </ul>

      <nav className="grid gap-3" aria-label="Your learning">
        <Link href="/me/progress" className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-4 font-semibold transition hover:border-brand"><BarChart3 size={20} className="text-brand" aria-hidden="true" /><span className="flex-1">Progress & history</span><ArrowRight size={18} className="text-ink-soft" aria-hidden="true" /></Link>
        <Link href="/placement" className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-4 font-semibold transition hover:border-brand"><Compass size={20} className="text-brand" aria-hidden="true" /><span className="flex-1">Retake the level check</span><ArrowRight size={18} className="text-ink-soft" aria-hidden="true" /></Link>
      </nav>

      <SettingsPanel goal={snapshot.settings.daily_goal_xp} reminderHour={snapshot.settings.reminder_hour} vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />

      <form action={logout}>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line bg-surface py-3.5 font-semibold text-ink-soft hover:border-danger hover:text-danger"><LogOut size={18} aria-hidden="true" />Sign out</button>
      </form>
      <p className="pb-4 text-center text-xs text-ink-soft">Signing out doesn&apos;t delete anything. Your progress is saved to your account.</p>
    </main>
  );
}
