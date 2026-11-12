// Hai cách đăng nhập duy nhất của ứng dụng: GitHub và Google.
import type { ReactNode } from "react";
import { GithubMark } from "@/components/common/github-mark";
import { GoogleMark } from "@/components/common/google-mark";
import type { AuthProvider } from "@/lib/types";

export const AUTH_PROVIDERS: AuthProvider[] = ["google", "github"];

export const providerMeta: Record<AuthProvider, { label: string; icon: (className: string) => ReactNode }> = {
  google: { label: "Google", icon: (className) => <GoogleMark className={className} /> },
  github: { label: "GitHub", icon: (className) => <GithubMark className={className} /> },
};

export function isAuthProvider(value: string): value is AuthProvider {
  return (AUTH_PROVIDERS as string[]).includes(value);
}
