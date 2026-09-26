export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-[calc(env(safe-area-inset-top)+1rem)]" aria-busy="true" aria-label="Loading">
      <div className="v2-skeleton h-3 w-full rounded-full" />
      <div className="v2-skeleton h-8 w-1/2 rounded-xl" />
      <div className="v2-skeleton h-40 rounded-3xl" />
      <div className="v2-skeleton h-14 rounded-2xl" />
      <div className="v2-skeleton h-14 rounded-2xl" />
    </main>
  );
}
