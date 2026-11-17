// Renders the simulated provider step used while the backend has no real OAuth configured.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthScreen, ProviderStep, isAuthProvider } from "@/features/auth";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.auth.providerPageTitle };

export default function ProviderPage({ params, searchParams }: PageProps<"/login/[provider]">) {
  return (
    <AuthScreen className="max-w-110">
      <Suspense fallback={<div className="h-80" />}>
        <ProviderPageContent params={params} searchParams={searchParams} />
      </Suspense>
    </AuthScreen>
  );
}

async function ProviderPageContent({ params, searchParams }: PageProps<"/login/[provider]">) {
  const { provider } = await params;
  if (!isAuthProvider(provider)) notFound();
  const query = await searchParams;
  return (
    <ProviderStep
      provider={provider}
      isSignUp={query.intent === "signup"}
      next={typeof query.next === "string" ? query.next : ""}
    />
  );
}
