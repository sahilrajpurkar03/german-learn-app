import { ResetPasswordGate } from "@/components/reset-password-gate";

// The reset link lands here with the session in the URL fragment, which only the browser can
// read, so the check happens in ResetPasswordGate rather than on the server.
export default function ResetPasswordPage() {
  return (
    <main className="auth-page flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-neutral-50">Set a new password</h1>
        <p className="mt-1 text-sm text-neutral-400">Choose a password with at least 8 characters.</p>
      </div>
      <ResetPasswordGate />
    </main>
  );
}
