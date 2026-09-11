import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveStudioAssessment } from "@/lib/studio-actions";
import { LearningStudio } from "@/components/studio/learning-studio";
import { logout } from "@/lib/auth-actions";

export default async function PlacementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("placement_completed")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Your profile could not be loaded. Please try again.");
  if (profile?.placement_completed) redirect("/learn");
  return <LearningStudio userId={user.id} initialAssessment saveAssessment={saveStudioAssessment} logoutAction={logout} />;
}
