import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlacementQuestions } from "@/lib/content";
import { PlacementQuiz } from "@/components/placement-quiz";

export default async function PlacementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("placement_completed")
    .eq("id", user.id)
    .single();
  if (profile?.placement_completed) redirect("/learn");

  const questions = await getPlacementQuestions();

  return (
    <main className="flex min-h-full flex-1 flex-col justify-center px-4 py-8">
      <PlacementQuiz questions={questions} />
    </main>
  );
}
