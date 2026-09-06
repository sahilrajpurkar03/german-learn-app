"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/lib/auth-actions";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      {isSignup && (
        <div className="space-y-1">
          <label htmlFor="displayName" className="text-sm font-medium text-neutral-200">
            Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Raj"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-neutral-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-neutral-200">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-blue-500"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-3 py-2 font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-neutral-400">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
