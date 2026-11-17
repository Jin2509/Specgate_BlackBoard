// Renders the sign-in page: provider buttons on a frosted-glass card over the forest photo.
import type { Metadata } from "next";
import { Suspense } from "react";

import { LogoMark } from "@/components/LogoMark";
import { LoginForm, PhotoBackdrop, getOAuthProviders } from "@/features/auth";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.auth.pageTitle };

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <PhotoBackdrop />
      <span className="mb-8 inline-flex items-center gap-2 text-lg font-semibold text-foreground sm:absolute sm:top-8 sm:left-10 sm:mb-0">
        <LogoMark className="size-8 text-foreground" />
        {t.common.brand}
      </span>
      <div className="w-full max-w-md rounded-3xl border border-foreground/15 bg-background/45 p-8 text-foreground shadow-2xl backdrop-blur-2xl backdrop-saturate-150 sm:p-10">
        <Suspense fallback={<LoginForm />}>
          <LoginWithProviders />
        </Suspense>
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">{t.auth.heroFoot}</p>
    </main>
  );
}

async function LoginWithProviders() {
  const { google, github } = await getOAuthProviders();
  return <LoginForm oauthProviders={{ google, github }} />;
}
