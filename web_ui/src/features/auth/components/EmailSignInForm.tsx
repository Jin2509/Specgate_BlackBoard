"use client";
// Signs in or creates an account with a one-time code sent to the user's email address.
import { LoaderCircle, Mail } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { format, t } from "@/lib/i18n";

import { submitEmailSignIn, type EmailSignInState } from "../api/auth-actions";

const CODE_MAX_LENGTH = 6;
const DISPLAY_NAME_MAX_LENGTH = 40;
const LABEL_CLASS = "text-[13px] font-semibold text-muted-foreground";
const PRIMARY_CLASS = "h-11 w-full rounded-xl";

export function EmailSignInForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<EmailSignInState, FormData>(submitEmailSignIn, { step: "email" });
  const describedBy = state.error ? "email-sign-in-error" : undefined;

  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.step === "email" ? (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="sign-in-email" className={LABEL_CLASS}>
              {t.auth.emailLabel}
            </Label>
            <Input
              key={`email-${state.attempt ?? 0}`}
              defaultValue={state.email}
              id="sign-in-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
              spellCheck={false}
              required
              aria-invalid={state.field === "email" ? true : undefined}
              aria-describedby={describedBy}
              className="h-10 bg-card"
            />
          </div>
          <Button type="submit" name="intent" value="send" disabled={isPending} className={PRIMARY_CLASS}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Mail />}
            {isPending ? t.auth.sendingCode : t.auth.sendCode}
          </Button>
        </>
      ) : (
        <CodeStep state={state} isPending={isPending} describedBy={describedBy} />
      )}
      {state.error ? (
        <p id="email-sign-in-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function CodeStep({
  state,
  isPending,
  describedBy,
}: {
  state: EmailSignInState;
  isPending: boolean;
  describedBy: string | undefined;
}) {
  return (
    <>
      <input type="hidden" name="email" value={state.email ?? ""} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {format(t.auth.codeSentTo, { email: state.email ?? "", minutes: state.expiresInMinutes ?? "" })}
      </p>
      {state.devCode ? (
        <p className="rounded-lg bg-background/60 px-3 py-2 text-sm text-foreground">
          {format(t.auth.devCodeNote, { code: state.devCode })}
        </p>
      ) : null}
      {state.notice ? <p className="text-sm text-foreground">{state.notice}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="sign-in-code" className={LABEL_CLASS}>
          {t.auth.codeLabel}
        </Label>
        <Input
          key={`code-${state.attempt ?? 0}`}
          defaultValue={state.code}
          id="sign-in-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t.auth.codePlaceholder}
          maxLength={CODE_MAX_LENGTH}
          required
          autoFocus={!state.needsName}
          aria-invalid={state.field === "code" ? true : undefined}
          aria-describedby={describedBy}
          className="h-10 bg-card tracking-[0.3em]"
        />
      </div>
      {state.needsName ? (
        <div className="grid gap-1.5">
          <Label htmlFor="sign-in-name" className={LABEL_CLASS}>
            {t.auth.displayName}
          </Label>
          <Input
            id="sign-in-name"
            name="displayName"
            autoComplete="name"
            placeholder={t.auth.displayNamePlaceholder}
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            required
            autoFocus
            aria-invalid={state.field === "displayName" ? true : undefined}
            aria-describedby={describedBy}
            className="h-10 bg-card"
          />
        </div>
      ) : null}
      <Button type="submit" name="intent" value="verify" disabled={isPending} className={PRIMARY_CLASS}>
        {isPending ? <LoaderCircle className="animate-spin" /> : null}
        {isPending ? t.auth.verifyingCode : t.auth.verifyCode}
      </Button>
      <div className="flex justify-between gap-2">
        <Button
          type="submit"
          name="intent"
          value="restart"
          variant="ghost"
          disabled={isPending}
          className="text-muted-foreground"
        >
          {t.auth.changeEmail}
        </Button>
        <Button type="submit" name="intent" value="resend" variant="ghost" disabled={isPending} className="text-muted-foreground">
          {t.auth.resendCode}
        </Button>
      </div>
    </>
  );
}
