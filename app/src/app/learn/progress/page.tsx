import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgressDetails } from "@/lib/content";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const details = await getProgressDetails(user.id);
  const maxTotal = Math.max(1, ...details.dailyAccuracy.map((d) => d.total));

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-neutral-50">Your progress</h1>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-50">{details.totalSessions}</p>
          <p className="text-xs text-neutral-500">Sessions completed</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-50">{details.totalXp}</p>
          <p className="text-xs text-neutral-500">Total XP</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Last 14 days</h2>
        {details.dailyAccuracy.length === 0 ? (
          <p className="text-sm text-neutral-500">No practice recorded yet — start your first session!</p>
        ) : (
          <div className="flex h-32 items-end gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            {details.dailyAccuracy.map((d) => {
              const accuracy = d.total > 0 ? d.correct / d.total : 0;
              const height = Math.max(8, (d.total / maxTotal) * 100);
              const color = accuracy >= 0.8 ? "bg-green-500" : accuracy >= 0.5 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={d.date}>
                  <div className={`w-full rounded-t ${color}`} style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {details.weakSpots.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-300">Focus areas</h2>
          <ul className="space-y-2">
            {details.weakSpots.map((w) => (
              <li
                key={`${w.itemType}-${w.itemId}`}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
              >
                <span className="text-neutral-200">{w.label}</span>
                <span className="text-neutral-500">
                  {Math.round(w.accuracy * 100)}% ({w.attempts} tries)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-auto flex justify-center gap-6 border-t border-neutral-800 pt-4 text-sm text-neutral-400">
        <Link href="/learn" className="hover:text-neutral-200">
          Learn
        </Link>
        <Link href="/learn/progress" className="text-blue-400">
          Progress
        </Link>
      </nav>
    </main>
  );
}
