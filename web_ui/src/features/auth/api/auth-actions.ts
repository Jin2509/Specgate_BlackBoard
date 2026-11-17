"use server";
// Signs in, signs up (Google or GitHub only) and signs out through the backend.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, LAST_WORKSPACE_COOKIE, SESSION_COOKIE_OPTIONS } from "@/config/session-cookie";
import { isApiError } from "@/lib/api/http-client";
import { t } from "@/lib/i18n";
import type { AuthProvider } from "@/types/profile";
import { toSafeNextPath } from "@/utils/safe-next-path";

import { createDevSession, deleteBackendSession, type DevSession } from "./auth-client";

const SERVER_ERROR_STATUS = 500;
const BAD_REQUEST_STATUS = 400;

export interface SignUpState {
  error?: string;
  field?: "login" | "displayName";
  /** The typed values, so the form shows them again after an error. */
  values?: { login: string; displayName: string };
  attempt?: number;
}

function toProvider(value: FormDataEntryValue | null): AuthProvider {
  return value === "github" ? "github" : "google";
}

async function finishSignIn(session: DevSession): Promise<never> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.token, SESSION_COOKIE_OPTIONS);
  jar.delete(LAST_WORKSPACE_COOKIE);
  redirect(toSafeNextPath(session.redirect) ?? "/");
}

/** Sign in with an account chosen on the simulated provider screen. */
export async function signIn(formData: FormData): Promise<void> {
  const next = toSafeNextPath(formData.get("next"));
  let session: DevSession;
  try {
    session = await createDevSession({
      provider: toProvider(formData.get("provider")),
      login: String(formData.get("login") ?? ""),
      next,
    });
  } catch (error) {
    const params = new URLSearchParams({ error: isApiError(error) && error.status >= SERVER_ERROR_STATUS ? "backend" : "oauth" });
    if (next) params.set("next", next);
    redirect(`/login?${params}`);
  }
  await finishSignIn(session);
}

/** Create the account of a new Google or GitHub identity, or sign in when it is already registered. */
export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const values = { login: String(formData.get("login") ?? ""), displayName: String(formData.get("displayName") ?? "") };
  let session: DevSession;
  try {
    session = await createDevSession({
      provider: toProvider(formData.get("provider")),
      login: values.login.trim(),
      displayName: values.displayName,
    });
  } catch (error) {
    const keep = { values, attempt: Date.now() };
    if (isApiError(error, BAD_REQUEST_STATUS, "INVALID_LOGIN")) return { ...keep, field: "login", error: error.message };
    if (isApiError(error, BAD_REQUEST_STATUS, "INVALID_NAME")) return { ...keep, field: "displayName", error: error.message };
    return { ...keep, error: isApiError(error) ? error.message : t.auth.createFailed };
  }
  return finishSignIn(session);
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  await deleteBackendSession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  jar.delete(LAST_WORKSPACE_COOKIE);
  redirect("/login");
}
