"use client";

import { useActionState } from "react";

import { createAccount } from "../actions";
import { initialAuthFormState } from "../form-state";
import { AuthField } from "./auth-field";

export function CreateAccountForm() {
  const [state, action, isPending] = useActionState(
    createAccount,
    initialAuthFormState,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <AuthField
        id="username"
        name="username"
        type="text"
        label="Username"
        autoComplete="username"
        placeholder="username"
        required
        error={state.fieldErrors?.username?.[0]}
      />

      <AuthField
        id="email"
        name="email"
        type="email"
        label="Your E-mail"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state.fieldErrors?.email?.[0]}
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        label="Create Password"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        required
        error={state.fieldErrors?.password?.[0]}
      />

      <AuthField
        id="repeat-password"
        name="repeatPassword"
        type="password"
        label="Repeat Password"
        autoComplete="new-password"
        placeholder="Ulangi password"
        required
        error={state.fieldErrors?.repeatPassword?.[0]}
      />

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "success"
              ? "rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm leading-6 text-green-200"
              : "rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm leading-6 text-red-200"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="brand-gradient inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(0,177,196,0.16)] transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
