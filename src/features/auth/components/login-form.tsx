"use client";

import { useActionState } from "react";

import { signInWithPassword } from "../actions";
import { initialAuthFormState } from "../form-state";
import { AuthField } from "./auth-field";

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, action, isPending] = useActionState(
    signInWithPassword,
    initialAuthFormState,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <AuthField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state.fieldErrors?.email?.[0]}
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Masukkan password"
        required
        error={state.fieldErrors?.password?.[0]}
      />

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm leading-6 text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="brand-gradient inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(0,177,196,0.16)] transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
