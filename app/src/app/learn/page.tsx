import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/content";
import { logout } from "@/lib/auth-actions";

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("placement_completed, next_checkin_at")
    .eq("id", user.id)
    .single();
  if (!profile?.placement_completed) redirect("/learn/placement");
  if (profile.next_checkin_at && new Date(profile.next_checkin_at) <= new Date()) redirect("/learn/checkin");

  const stats = await getDashboardStats(user.id);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">Servus, {stats.displayName} 👋</p>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Level {stats.currentLevel.toUpperCase()}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-300">
            Log out
          </button>
        </form>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Streak" value={`${stats.streakCurrent} 🔥`} />
        <StatCard label="XP" value={String(stats.xp)} />
        <StatCard label="Due" value={String(stats.dueCount)} />
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-center">
        <p className="text-sm text-neutral-400">
          {stats.practicedToday ? "You've practiced today — go again for extra XP!" : `${stats.dailyGoalMinutes} min goal today`}
        </p>
        <Link
          href="/learn/session"
          className="mt-4 inline-block w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Start session
        </Link>
      </section>

      {stats.weakSpots.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-300">Needs more practice</h2>
          <ul className="space-y-2">
            {stats.weakSpots.map((w) => (
              <li
                key={`${w.itemType}-${w.itemId}`}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
              >
                <span className="text-neutral-200">{w.label}</span>
                <span className="text-red-400">{Math.round(w.accuracy * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-auto flex justify-center gap-6 border-t border-neutral-800 pt-4 text-sm text-neutral-400">
        <Link href="/learn" className="text-blue-400">
          Learn
        </Link>
        <Link href="/learn/progress" className="hover:text-neutral-200">
          Progress
        </Link>
      </nav>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-center">
      <p className="text-lg font-semibold text-neutral-50">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
