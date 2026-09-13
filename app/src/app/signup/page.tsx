import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/auth-actions";

export default function SignupPage() {
  return (
    <main className="auth-page flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-50">Los geht&apos;s</h1>
        <p className="mt-1 text-sm text-neutral-400">Create an account to start tracking your progress.</p>
      </div>
      <AuthForm mode="signup" action={signup} />
    </main>
  );
}
