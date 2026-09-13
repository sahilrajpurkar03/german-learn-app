import { LearningStudio } from "@/components/studio/learning-studio";
import { SessionRunner } from "@/components/session-runner";
import { reviewPreviewItems } from "@/lib/review-mission";

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if ((await searchParams).mode === "review") return <SessionRunner sessionId="preview" items={reviewPreviewItems} userId="preview" preview />;
  return <LearningStudio userId="preview" preview />;
}