import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/auth-actions";
import { Logo } from "@/ui/logo";

const MESSAGES: Record<string, { tone: "error" | "status"; text: string }> = {
  google: { tone: "error", text: "Google sign-in didn't complete. Please try again, or use your email and password." },
  deleted: { tone: "status", text: "Your account and its learning data have been deleted." },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const params = await searchParams;
  const message = params.deleted ? MESSAGES.deleted : params.error ? MESSAGES[params.error] : undefined;
  return (
    <main className="auth-page flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <div className="mb-4 flex justify-center"><Logo size={56} withName={false} /></div>
        <h1 className="text-2xl font-semibold text-neutral-50">Willkommen zurück</h1>
        <p className="mt-1 text-sm text-neutral-400">Log in to continue your German practice.</p>
      </div>
      {message && <p role={message.tone === "error" ? "alert" : "status"} className="w-full max-w-sm rounded-lg border border-current px-3 py-2 text-sm">{message.text}</p>}
      <AuthForm mode="login" action={login} />
    </main>
  );
}
