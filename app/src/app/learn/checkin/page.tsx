import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/content";
import { saveStudioAssessment } from "@/lib/studio-actions";
import { LearningStudio } from "@/components/studio/learning-studio";
import { logout } from "@/lib/auth-actions";

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("placement_completed, next_checkin_at")
    .eq("id", user.id)
    .single();

  if (error) throw new Error("Your profile could not be loaded. Please try again.");
  if (!profile?.placement_completed) redirect("/learn/placement");
  if (profile.next_checkin_at && new Date(profile.next_checkin_at) > new Date()) redirect("/learn");
  const stats = await getDashboardStats(user.id);
  return <LearningStudio userId={user.id} stats={stats} initialAssessment saveAssessment={saveStudioAssessment} logoutAction={logout} />;
}
