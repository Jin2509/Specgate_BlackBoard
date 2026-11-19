// Renders the simulated provider step: choose a registered account, or ?intent=signup to create one.
import { UserPlus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { format, t } from "@/lib/i18n";
import type { AuthProvider } from "@/types/profile";

import { AccountChooser } from "./AccountChooser";
import { SignUpForm } from "./SignUpForm";
import { listDevAccounts } from "../api/auth-client";
import { PROVIDER_DETAILS } from "../utils/auth-providers";

export async function ProviderStep({ provider, isSignUp, next }: { provider: AuthProvider; isSignUp: boolean; next: string }) {
  const details = PROVIDER_DETAILS[provider];

  function toQuery(extra: string): string {
    const params = new URLSearchParams(extra);
    if (next) params.set("next", next);
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  if (isSignUp) {
    return (
      <>
        <StepHeader icon={details.renderIcon("size-6")} title={format(t.auth.signUpWithTitle, { provider: details.label })} />
        <SignUpForm provider={provider} />
        <StepFooter>
          {t.auth.hasAccount}
          <Link href={`/login/${provider}${toQuery("")}`} className="text-primary-strong hover:underline">
            {t.auth.signIn}
          </Link>
        </StepFooter>
      </>
    );
  }

  const accounts = (await listDevAccounts(provider)).map((account) => ({
    login: account.login,
    displayName: account.user.displayName,
    initial: account.user.initial,
  }));

  return (
    <>
      <StepHeader
        icon={details.renderIcon("size-6")}
        title={format(t.auth.signInWithTitle, { provider: details.label })}
        lead={t.auth.chooseAccount}
      />
      <AccountChooser provider={provider} accounts={accounts} />
      <Link
        href={`/login/${provider}${toQuery("intent=signup")}`}
        className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <UserPlus className="size-4 shrink-0" />
        {format(t.auth.otherAccount, { provider: details.label })}
      </Link>
      <StepFooter providerLabel={details.label}>
        <Link href="/login" className="text-primary-strong hover:underline">
          {t.auth.changeMethod}
        </Link>
      </StepFooter>
    </>
  );
}

function StepHeader({ icon, title, lead }: { icon: ReactNode; title: string; lead?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">{icon}</span>
      <h1 className="mt-4 text-xl font-semibold text-sidebar-accent-foreground">{title}</h1>
      {lead ? <p className="mt-1 text-sm text-muted-foreground">{lead}</p> : null}
    </div>
  );
}

function StepFooter({ providerLabel, children }: { providerLabel?: string; children: ReactNode }) {
  return (
    <p className="mt-5 text-center text-xs leading-relaxed text-subtle">
      {children}
      {providerLabel ? (
        <>
          <br />
          {format(t.auth.simulatedNote, { provider: providerLabel })}
        </>
      ) : null}
    </p>
  );
}
