"use client";
// Simulates the details Google or GitHub return after consent, then proves the email with a code before creating the account.
import { LoaderCircle, Mail } from "lucide-react";
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
const CODE_MAX_LENGTH = 6;
const LABEL_CLASS = "text-[13px] font-semibold text-muted-foreground";
const ERROR_ID = "signup-error";

export function SignUpForm({ provider }: { provider: AuthProvider }) {
  const [state, formAction, isPending] = useActionState<SignUpState, FormData>(signUp, { step: "details" });

  return (
    <form action={formAction} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="provider" value={provider} />
      {state.step === "details" ? (
        <DetailsStep provider={provider} state={state} isPending={isPending} />
      ) : (
        <CodeStep provider={provider} state={state} isPending={isPending} />
      )}
    </form>
  );
}

function ErrorText({ state }: { state: SignUpState }) {
  return state.error ? (
    <p id={ERROR_ID} role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  ) : null;
}

function invalidProps(state: SignUpState, field: NonNullable<SignUpState["field"]>) {
  return state.field === field ? { "aria-invalid": true, "aria-describedby": ERROR_ID } : {};
}

function DetailsStep({ provider, state, isPending }: { provider: AuthProvider; state: SignUpState; isPending: boolean }) {
  const isGithub = provider === "github";
  const attempt = state.attempt ?? 0;
  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-login" className={LABEL_CLASS}>
          {isGithub ? t.auth.githubLogin : t.auth.googleEmail}
        </Label>
        <Input
          key={`login-${attempt}`}
          defaultValue={state.values?.login}
          id="signup-login"
          name="login"
          type={isGithub ? "text" : "email"}
          autoComplete={isGithub ? "username" : "email"}
          placeholder={isGithub ? t.auth.githubLoginPlaceholder : t.auth.googleEmailPlaceholder}
          spellCheck={false}
          required
          {...invalidProps(state, "login")}
          className="h-10 bg-card"
        />
      </div>
      {isGithub ? (
        <div className="grid gap-1.5">
          <Label htmlFor="signup-email" className={LABEL_CLASS}>
            {t.auth.verificationEmail}
          </Label>
          <Input
            key={`email-${attempt}`}
            defaultValue={state.values?.email}
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t.auth.googleEmailPlaceholder}
            spellCheck={false}
            required
            {...invalidProps(state, "email")}
            className="h-10 bg-card"
          />
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="signup-name" className={LABEL_CLASS}>
          {t.auth.displayName}
        </Label>
        <Input
          key={`name-${attempt}`}
          defaultValue={state.values?.displayName}
          id="signup-name"
          name="displayName"
          autoComplete="name"
          placeholder={t.auth.displayNamePlaceholder}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          required
          {...invalidProps(state, "displayName")}
          className="h-10 bg-card"
        />
      </div>
      <ErrorText state={state} />
      <div className="grid gap-2">
        <Button type="submit" name="intent" value="send" disabled={isPending} className="h-10">
          {isPending ? <LoaderCircle className="animate-spin" /> : <Mail />}
          {isPending ? t.auth.sendingCode : t.auth.sendVerificationCode}
        </Button>
        <Button asChild type="button" variant="ghost" className="h-10 text-muted-foreground">
          <Link href="/login" prefetch={false}>
            {t.auth.cancelSignUp}
          </Link>
        </Button>
      </div>
    </>
  );
}

function CodeStep({ provider, state, isPending }: { provider: AuthProvider; state: SignUpState; isPending: boolean }) {
  const values = state.values ?? { login: "", email: "", displayName: "" };
  const email = provider === "google" ? values.login : values.email;
  return (
    <>
      <input type="hidden" name="login" value={values.login} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="displayName" value={values.displayName} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {format(t.auth.codeSentTo, { email, minutes: state.expiresInMinutes ?? "" })}
      </p>
      {state.notice ? <p className="text-sm text-foreground">{state.notice}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="signup-code" className={LABEL_CLASS}>
          {t.auth.codeLabel}
        </Label>
        <Input
          key={`code-${state.attempt ?? 0}`}
          id="signup-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t.auth.codePlaceholder}
          maxLength={CODE_MAX_LENGTH}
          required
          autoFocus
          {...invalidProps(state, "code")}
          className="h-10 bg-card tracking-[0.3em]"
        />
      </div>
      <ErrorText state={state} />
      <Button type="submit" name="intent" value="create" disabled={isPending} className="h-10">
        {isPending ? <LoaderCircle className="animate-spin" /> : PROVIDER_DETAILS[provider].renderIcon("size-4")}
        {isPending ? t.auth.creating : t.auth.verifyAndCreate}
      </Button>
      <div className="flex justify-between gap-2">
        <Button type="submit" name="intent" value="edit" variant="ghost" disabled={isPending} className="text-muted-foreground">
          {t.auth.editDetails}
        </Button>
        <Button type="submit" name="intent" value="resend" variant="ghost" disabled={isPending} className="text-muted-foreground">
          {t.auth.resendCode}
        </Button>
      </div>
    </>
  );
}
