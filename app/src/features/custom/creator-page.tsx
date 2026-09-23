"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChapterCreator } from "@/components/studio/chapter-creator";
import { getPersonalLibrary } from "@/components/studio/personal-chapter-client";
import "@/components/studio/studio.css";
import "@/components/studio/personal-chapters.css";

/** The existing, privacy-reviewed creator (consent, redaction, quotas) embedded in the new shell. */
export function CreatorPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    getPersonalLibrary(false).then((library) => setAvailable(library.available)).catch(() => setAvailable(false));
  }, []);
  if (available === null) return <div className="v2-skeleton mx-4 mt-10 h-64 rounded-3xl" aria-busy="true" />;
  return (
    <div className="studio-shell custom-creator-embed">
      <ChapterCreator available={available} onExit={() => router.push("/custom")} onCreated={async () => router.push("/custom")} />
    </div>
  );
}
