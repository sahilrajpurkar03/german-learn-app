import { PasswordRecoveryForm } from "@/components/password-recovery-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-neutral-50">Forgot password?</h1>
        <p className="mt-1 text-sm text-neutral-400">Enter your email to receive a reset link.</p>
        {error === "invalid-link" && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            This reset link is invalid or expired, or was opened in a different browser. Request a new link and open it in this browser.
          </p>
        )}
      </div>
      <PasswordRecoveryForm mode="request" />
    </main>
  );
}