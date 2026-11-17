"use client";
// Simulates the details Google or GitHub return after consent, to create an account without real OAuth.
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { format, t } from "@/lib/i18n";
import type { AuthProvider } from "@/types/profile";

import { signUp, type SignUpState } from "../api/auth-actions";
import { PROVIDER_DETAILS } from "../utils/auth-providers";

const DISPLAY_NAME_MAX_LENGTH = 40;

export function SignUpForm({ provider }: { provider: AuthProvider }) {
  const [state, formAction, isPending] = useActionState<SignUpState, FormData>(signUp, {});
  const isGithub = provider === "github";
  const providerLabel = PROVIDER_DETAILS[provider].label;

  return (
    <form action={formAction} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="provider" value={provider} />
      <div className="grid gap-1.5">
        <Label htmlFor="signup-login" className="text-[13px] font-semibold text-muted-foreground">
          {isGithub ? t.auth.githubLogin : t.auth.googleEmail}
        </Label>
        <Input
          key={`login-${state.attempt ?? 0}`}
          defaultValue={state.values?.login}
          id="signup-login"
          name="login"
          type={isGithub ? "text" : "email"}
          autoComplete={isGithub ? "username" : "email"}
          placeholder={isGithub ? t.auth.githubLoginPlaceholder : t.auth.googleEmailPlaceholder}
          spellCheck={false}
          required
          aria-invalid={state.field === "login" ? true : undefined}
          aria-describedby={state.field === "login" ? "signup-error" : undefined}
          className="h-10 bg-card"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-name" className="text-[13px] font-semibold text-muted-foreground">
          {t.auth.displayName}
        </Label>
        <Input
          key={`name-${state.attempt ?? 0}`}
          defaultValue={state.values?.displayName}
          id="signup-name"
          name="displayName"
          autoComplete="name"
          placeholder={t.auth.displayNamePlaceholder}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          required
          aria-invalid={state.field === "displayName" ? true : undefined}
          aria-describedby={state.field === "displayName" ? "signup-error" : undefined}
          className="h-10 bg-card"
        />
      </div>
      {state.error ? (
        <p id="signup-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Button type="submit" disabled={isPending} className="h-10">
          {isPending ? <LoaderCircle className="animate-spin" /> : PROVIDER_DETAILS[provider].renderIcon("size-4")}
          {isPending ? t.auth.creating : format(t.auth.agreeAndCreate, { provider: providerLabel })}
        </Button>
        <Button asChild type="button" variant="ghost" className="h-10 text-muted-foreground">
          <Link href="/login" prefetch={false}>
            {t.auth.cancelSignUp}
          </Link>
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-subtle">{format(t.auth.existingAccountNote, { provider: providerLabel })}</p>
    </form>
  );
}
