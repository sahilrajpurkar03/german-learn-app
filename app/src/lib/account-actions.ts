"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AccountResult = { ok: true; message: string } | { ok: false; message: string };

async function signedIn() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error("Your session has expired. Please sign in again.");
  return { client, user: data.user };
}

export async function updateDisplayName(name: string): Promise<AccountResult> {
  const parsed = z.string().trim().min(1, "Please enter a name.").max(60, "Keep it under 60 characters.").safeParse(name);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { client, user } = await signedIn();
  const { error } = await client.from("profiles").update({ display_name: parsed.data }).eq("id", user.id);
  if (error) return { ok: false, message: "Your name could not be saved. Please try again." };
  revalidatePath("/me");
  revalidatePath("/today");
  return { ok: true, message: "Name updated." };
}

/** Accounts created with email must confirm the current password; Google-only accounts can set a first password. */
export async function changePassword(current: string, next: string): Promise<AccountResult> {
  if (next.length < 8) return { ok: false, message: "Use at least 8 characters for the new password." };
  if (next.length > 72) return { ok: false, message: "Use at most 72 characters." };
  const { client, user } = await signedIn();
  const hasPassword = (user.app_metadata?.providers as string[] | undefined)?.includes("email") ?? Boolean(user.identities?.some((identity) => identity.provider === "email"));
  if (hasPassword) {
    if (!current) return { ok: false, message: "Enter your current password." };
    if (current === next) return { ok: false, message: "The new password must be different." };
    const { error } = await client.auth.signInWithPassword({ email: user.email ?? "", password: current });
    if (error) return { ok: false, message: "Your current password is not correct." };
  }
  const { error } = await client.auth.updateUser({ password: next });
  if (error) return { ok: false, message: error.message || "The password could not be changed. Please try again." };
  return { ok: true, message: hasPassword ? "Password changed." : "Password set. You can now also sign in with your email." };
}
