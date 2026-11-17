// Calls the backend's authentication endpoints (/api/auth/*); the browser only ever holds the httpOnly session cookie.
import { callJson, isApiError, request } from "@/lib/api/http-client";
import type { AuthProvider, Profile } from "@/types/profile";

const UNAUTHORIZED_STATUS = 401;

export interface BackendSession {
  user: Profile;
  home: string;
  /** A fresh 30-day token, so the session slides with every visit. */
  token?: string;
  identities: Array<{ provider: AuthProvider; login: string }>;
}

export interface OAuthProviders {
  google: boolean;
  github: boolean;
  devLogin: boolean;
}

export interface DevAccount {
  provider: AuthProvider;
  login: string;
  user: Profile;
}

export interface DevSession {
  token: string;
  user: Profile;
  created: boolean;
  redirect: string;
}

/** Return the session of a token, or null when the token is wrong, expired or its user is gone. */
export async function getBackendSession(token: string | undefined): Promise<BackendSession | null> {
  if (!token) return null;
  try {
    return await callJson<BackendSession>("/auth/session", { token });
  } catch (error) {
    if (isApiError(error, UNAUTHORIZED_STATUS)) return null;
    throw error;
  }
}

/** Stand in for the provider step while the backend has no real OAuth configured. */
export function createDevSession(input: {
  provider: AuthProvider;
  login: string;
  displayName?: string;
  next?: string;
}): Promise<DevSession> {
  return callJson<DevSession>("/auth/dev-sessions", { method: "POST", body: input });
}

export async function listDevAccounts(provider: AuthProvider): Promise<DevAccount[]> {
  try {
    return await callJson<DevAccount[]>("/auth/dev-accounts", { query: { provider } });
  } catch {
    // The backend disables this listing outside development; the chooser then shows no accounts.
    return [];
  }
}

export async function deleteBackendSession(token: string | undefined): Promise<void> {
  await request("/auth/session", { method: "DELETE", token }).catch(() => undefined);
}

export async function getOAuthProviders(): Promise<OAuthProviders> {
  try {
    return await callJson<OAuthProviders>("/auth/providers");
  } catch {
    // An unreachable backend is treated as "simulated sign-in only"; the page itself reports the outage later.
    return { google: false, github: false, devLogin: true };
  }
}
