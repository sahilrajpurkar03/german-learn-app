import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-50">Willkommen zurück</h1>
        <p className="mt-1 text-sm text-neutral-400">Log in to continue your German practice.</p>
      </div>
      <AuthForm mode="login" action={login} />
    </main>
  );
}
