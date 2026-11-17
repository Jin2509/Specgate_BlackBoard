// Resolves the signed-in user on the server and redirects to the sign-in page when there is none.
import { redirect } from "next/navigation";
import { cache } from "react";

import { isApiError } from "@/lib/api/http-client";
import { callApi, getSessionToken } from "@/lib/api/server-api";
import type { Me } from "@/types/account";

import { getBackendSession, type BackendSession } from "./auth-client";

const UNAUTHORIZED_STATUS = 401;

function toSignInPath(next?: string): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

export const getCurrentSession = cache(async (): Promise<BackendSession | null> => getBackendSession(await getSessionToken()));

export const getMe = cache(() => callApi<Me>("/me"));

export async function requireSession(next?: string): Promise<BackendSession> {
  const session = await getCurrentSession();
  if (!session) redirect(toSignInPath(next));
  return session;
}

/** Return the profile, personal workspace, key and workspace rail of the signed-in user. */
export async function requireMe(next?: string): Promise<Me> {
  try {
    return await getMe();
  } catch (error) {
    if (isApiError(error, UNAUTHORIZED_STATUS)) redirect(toSignInPath(next));
    throw error;
  }
}
