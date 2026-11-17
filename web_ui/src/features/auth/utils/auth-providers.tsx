// Lists the only two sign-in providers, GitHub and Google, with their names and logos.
import type { ReactNode } from "react";

import { GithubMark } from "@/components/GithubMark";
import { GoogleMark } from "@/components/GoogleMark";
import type { AuthProvider } from "@/types/profile";

export const AUTH_PROVIDERS: readonly AuthProvider[] = ["google", "github"];

export const PROVIDER_DETAILS: Record<AuthProvider, { label: string; renderIcon: (className: string) => ReactNode }> = {
  google: { label: "Google", renderIcon: (className) => <GoogleMark className={className} /> },
  github: { label: "GitHub", renderIcon: (className) => <GithubMark className={className} /> },
};

export function isAuthProvider(value: string): value is AuthProvider {
  return AUTH_PROVIDERS.some((provider) => provider === value);
}
