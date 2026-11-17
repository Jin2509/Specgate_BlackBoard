"use client";
// Signs in or creates an account with Google or GitHub only; ?mode=signup switches between the two modes.
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { useQueryParam } from "@/hooks/use-query-param";
import { toApiPath } from "@/lib/api/api-base-path";
import { format, t } from "@/lib/i18n";
import type { AuthProvider } from "@/types/profile";
import { cn } from "@/utils/cn";

import { AUTH_PROVIDERS, PROVIDER_DETAILS } from "../utils/auth-providers";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: t.auth.errorOauth,
  cancelled: t.auth.errorCancelled,
  backend: t.auth.errorBackend,
};

/** `oauthProviders`: providers with real OAuth on the backend go straight there; others use the simulated screen. */
export function LoginForm({ oauthProviders = {} }: { oauthProviders?: Partial<Record<AuthProvider, boolean>> }) {
  const next = useQueryParam("next") ?? "";
  const errorCode = useQueryParam("error");
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.oauth) : null;
  const isSignUp = useQueryParam("mode") === "signup";

  function toQuery(extra: Record<string, string>): string {
    const params = new URLSearchParams(extra);
    if (next) params.set("next", next);
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  return (
    <div>
      <div role="tablist" aria-label={t.auth.modeTabs} className="grid grid-cols-2 gap-1 rounded-xl bg-background/50 p-1">
        <ModeTab href={`/login${toQuery({})}`} isSelected={!isSignUp}>
          {t.auth.signIn}
        </ModeTab>
        <ModeTab href={`/login${toQuery({ mode: "signup" })}`} isSelected={isSignUp}>
          {t.auth.signUp}
        </ModeTab>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">{isSignUp ? t.auth.signUp : t.auth.signIn}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isSignUp ? t.auth.signUpLead : t.auth.signInLead}</p>

      <div className="mt-8 grid gap-3">
        {AUTH_PROVIDERS.map((provider) => {
          const details = PROVIDER_DETAILS[provider];
          const label = (
            <>
              {details.renderIcon("size-5")}{" "}
              {format(isSignUp ? t.auth.signUpWith : t.auth.continueWith, { provider: details.label })}
            </>
          );
          return (
            <Button
              key={provider}
              asChild
              variant="outline"
              className="h-11 w-full justify-center gap-3 rounded-xl border-transparent bg-foreground px-4 text-sm font-medium text-background shadow-lg transition-all hover:-translate-y-px hover:bg-foreground/90 hover:text-background"
            >
              {oauthProviders[provider] ? (
                <a href={`${toApiPath(`/auth/${provider}/start`)}${toQuery({ mode: isSignUp ? "signup" : "login" })}`}>{label}</a>
              ) : (
                <Link href={`/login/${provider}${toQuery(isSignUp ? { intent: "signup" } : {})}`} prefetch={false}>
                  {label}
                </Link>
              )}
            </Button>
          );
        })}
      </div>

      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-lg bg-destructive/20 px-3 py-2 text-sm text-foreground">
          {errorMessage}
        </p>
      ) : null}

      {isSignUp ? (
        <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-subtle">
          <li>{t.auth.signUpStep1}</li>
          <li>{t.auth.signUpStep2}</li>
          <li>{t.auth.signUpStep3}</li>
        </ol>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
        <Link
          href={`/login${toQuery(isSignUp ? {} : { mode: "signup" })}`}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {isSignUp ? t.auth.signIn : t.auth.signUp}
        </Link>
      </p>
    </div>
  );
}

function ModeTab({ href, isSelected, children }: { href: string; isSelected: boolean; children: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={isSelected}
      className={cn(
        "rounded-lg px-3 py-2 text-center text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isSelected
          ? "bg-foreground font-medium text-background shadow-sm"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
