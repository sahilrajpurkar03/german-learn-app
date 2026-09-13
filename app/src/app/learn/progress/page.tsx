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
    <main className="account-progress mx-auto flex min-h-full w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <h1 className="text-xl font-semibold text-neutral-800">Your progress</h1>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-800">{details.totalSessions}</p>
          <p className="text-xs text-neutral-600">Sessions completed</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-800">{details.totalXp}</p>
          <p className="text-xs text-neutral-600">Total XP</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Last 14 days</h2>
        {details.dailyAccuracy.length === 0 ? (
          <p className="text-sm text-neutral-600">No practice recorded yet — start your first session!</p>
        ) : (
          <div className="flex h-32 items-end gap-1.5 rounded-lg border border-neutral-200 bg-white p-3">
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
          <h2 className="mb-2 text-sm font-medium text-neutral-700">Focus areas</h2>
          <ul className="space-y-2">
            {details.weakSpots.map((w) => (
              <li
                key={`${w.itemType}-${w.itemId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <span className="min-w-0 max-w-full text-neutral-800">{w.label}</span>
                <span className="text-neutral-600">
                  {Math.round(w.accuracy * 100)}% ({w.attempts} tries)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-auto grid grid-cols-2 gap-3 border-t border-neutral-200 pt-4 text-center text-sm text-neutral-700">
        <Link href="/learn" className="min-h-11 p-3 hover:underline">
          Learn
        </Link>
        <Link href="/learn/progress" className="min-h-11 p-3 text-green-800" aria-current="page">
          Progress
        </Link>
      </nav>
    </main>
  );
}
