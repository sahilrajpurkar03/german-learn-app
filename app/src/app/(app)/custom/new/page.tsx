import type { Metadata } from "next";
import { requireLearner } from "@/lib/learning/guard";
import { CreatorPage } from "@/features/custom/creator-page";

export const metadata: Metadata = { title: "Create a lesson · Sprechen" };

export default async function NewCustomLessonPage() {
  await requireLearner();
  return <CreatorPage />;
}
