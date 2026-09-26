// Shown at once when a tab is tapped, while the next screen is prepared on the server.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-10" aria-busy="true" aria-label="Loading">
      <div className="v2-skeleton h-10 w-2/3 rounded-xl" />
      <div className="v2-skeleton h-56 rounded-[2rem]" />
      <div className="v2-skeleton h-20 rounded-3xl" />
      <div className="v2-skeleton h-32 rounded-3xl" />
    </main>
  );
}
