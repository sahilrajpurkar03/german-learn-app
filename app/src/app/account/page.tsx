import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentLearner } from "@/lib/learning/server";
import { displayName } from "@/lib/learning/guard";
import { v2Enabled } from "@/lib/v2";
import { AccountPanel } from "@/features/me/account-panel";
import { MotionProvider } from "@/ui/motion";
import { ThemeScript } from "@/ui/theme-script";

export const metadata: Metadata = { title: "Account · Sprechen" };

// Account settings work in both app versions, so this page only needs a signed-in user.
export default async function AccountPage() {
  const learner = await currentLearner();
  if (!learner) redirect("/login");
  const { client, user } = learner;
  const name = await displayName(client, user.id);
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? user.identities?.map((identity) => identity.provider) ?? [];
  const back = (await v2Enabled()) ? { href: "/me", label: "Me" } : { href: "/learn", label: "Back to practice" };
  return (
    <div className="v2 flex min-h-dvh flex-1 flex-col">
      <ThemeScript />
      <MotionProvider>
        <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
          <Link href={back.href} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand"><ArrowLeft size={16} aria-hidden="true" />{back.label}</Link>
          <h1 className="mb-6 mt-3 font-display text-3xl font-semibold">Account & privacy</h1>
          <AccountPanel name={name === "there" ? "" : name} email={user.email ?? ""} providers={providers} />
        </main>
      </MotionProvider>
    </div>
  );
}
