import { redirect } from "next/navigation";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/forgot-password?error=invalid-link");

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-neutral-50">Set a new password</h1>
        <p className="mt-1 text-sm text-neutral-400">Choose a password with at least 8 characters.</p>
      </div>
      <PasswordRecoveryForm mode="reset" />
    </main>
  );
}