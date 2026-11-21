"use server";
// Signs in, signs up (Google, GitHub or an emailed one-time code) and signs out through the backend.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, LAST_WORKSPACE_COOKIE, SESSION_COOKIE_OPTIONS } from "@/config/session-cookie";
import { isApiError, toErrorMessage } from "@/lib/api/http-client";
import { t } from "@/lib/i18n";
import type { AuthProvider } from "@/types/profile";
import { toSafeNextPath } from "@/utils/safe-next-path";

import { createDevSession, createEmailCode, createEmailSession, deleteBackendSession, type DevSession } from "./auth-client";

const SERVER_ERROR_STATUS = 500;
const BAD_REQUEST_STATUS = 400;
const CONFLICT_STATUS = 409;
const SECONDS_PER_MINUTE = 60;

export interface SignUpState {
  /** details: login, email and name; code: the code emailed to prove the address before the account exists. */
  step: "details" | "code";
  error?: string;
  field?: "login" | "email" | "displayName" | "code";
  /** The typed values, so the form shows them again after an error and carries them into the code step. */
  values?: { login: string; email: string; displayName: string };
  expiresInMinutes?: number;
  notice?: string;
  attempt?: number;
}

type SignUpIntent = "send" | "resend" | "edit" | "create";

function toSignUpIntent(value: FormDataEntryValue | null): SignUpIntent {
  return value === "send" || value === "resend" || value === "edit" ? value : "create";
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

type SignUpValues = NonNullable<SignUpState["values"]>;

function toSignUpValues(formData: FormData): SignUpValues {
  return {
    login: String(formData.get("login") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    displayName: String(formData.get("displayName") ?? ""),
  };
}

function toDetailsError(error: unknown, provider: AuthProvider, values: SignUpValues): SignUpState {
  const keep = { step: "details" as const, values, attempt: Date.now() };
  if (isApiError(error, BAD_REQUEST_STATUS, "INVALID_LOGIN")) return { ...keep, field: "login", error: error.message };
  if (isApiError(error, BAD_REQUEST_STATUS, "INVALID_NAME")) return { ...keep, field: "displayName", error: error.message };
  if (isApiError(error, BAD_REQUEST_STATUS, "INVALID_EMAIL"))
    return { ...keep, field: provider === "google" ? "login" : "email", error: error.message };
  return { ...keep, error: toErrorMessage(error, t.auth.createFailed) };
}

async function sendSignUpCode(provider: AuthProvider, values: SignUpValues, isResend: boolean): Promise<SignUpState> {
  const email = provider === "google" ? values.login : values.email;
  try {
    const sent = await createEmailCode(email);
    return {
      step: "code",
      values,
      expiresInMinutes: Math.round(sent.expiresInSeconds / SECONDS_PER_MINUTE),
      notice: isResend ? t.auth.codeResent : undefined,
      attempt: Date.now(),
    };
  } catch (error) {
    if (!isResend) return toDetailsError(error, provider, values);
    return { step: "code", values, error: toErrorMessage(error, t.auth.codeSendFailed), attempt: Date.now() };
  }
}

/**
 * Create the account of a new Google or GitHub identity on the simulated screen, in two steps: check the details
 * and email a code, then create the account with that code. An identity already registered signs in at once.
 */
export async function signUp(previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const provider = toProvider(formData.get("provider"));
  const intent = toSignUpIntent(formData.get("intent"));
  const values = toSignUpValues(formData);
  if (intent === "edit") return { step: "details", values, attempt: Date.now() };
  if (intent === "resend") return sendSignUpCode(provider, values, true);

  const code = intent === "create" ? String(formData.get("code") ?? "").replace(/\s/g, "") : undefined;
  const email = provider === "google" ? values.login : values.email;
  let session: DevSession;
  try {
    session = await createDevSession({ provider, login: values.login, displayName: values.displayName, email, code });
  } catch (error) {
    if (intent === "send" && isApiError(error, BAD_REQUEST_STATUS, "EMAIL_CODE_REQUIRED"))
      return sendSignUpCode(provider, values, false);
    if (isApiError(error, BAD_REQUEST_STATUS, "EMAIL_CODE_INVALID"))
      return { ...previous, step: "code", values, field: "code", error: error.message, notice: undefined, attempt: Date.now() };
    return toDetailsError(error, provider, values);
  }
  return finishSignIn(session);
}

export interface EmailSignInState {
  step: "email" | "code";
  email?: string;
  /** The typed code, kept when the backend asks for a display name first. */
  code?: string;
  expiresInMinutes?: number;
  needsName?: boolean;
  notice?: string;
  error?: string;
  field?: "email" | "code" | "displayName";
  attempt?: number;
}

type EmailIntent = "send" | "resend" | "restart" | "verify";

function toEmailIntent(value: FormDataEntryValue | null): EmailIntent {
  return value === "send" || value === "resend" || value === "restart" ? value : "verify";
}

async function sendEmailCode(previous: EmailSignInState, email: string, isResend: boolean): Promise<EmailSignInState> {
  try {
    const sent = await createEmailCode(email);
    return {
      step: "code",
      email: sent.email,
      expiresInMinutes: Math.round(sent.expiresInSeconds / SECONDS_PER_MINUTE),
      notice: isResend ? t.auth.codeResent : undefined,
      attempt: Date.now(),
    };
  } catch (error) {
    return {
      ...previous,
      step: isResend ? "code" : "email",
      email,
      notice: undefined,
      error: toErrorMessage(error, t.auth.codeSendFailed),
      field: isResend ? undefined : "email",
      attempt: Date.now(),
    };
  }
}

/** Run one step of email sign-in: send or resend the code, go back to the address, or check the code. */
export async function submitEmailSignIn(previous: EmailSignInState, formData: FormData): Promise<EmailSignInState> {
  const intent = toEmailIntent(formData.get("intent"));
  const email = String(formData.get("email") ?? "").trim();
  if (intent === "restart") return { step: "email", email, attempt: Date.now() };
  if (intent !== "verify") return sendEmailCode(previous, email, intent === "resend");

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const displayName = String(formData.get("displayName") ?? "");
  const keep = { ...previous, step: "code" as const, email, code, notice: undefined, attempt: Date.now() };
  let session: DevSession;
  try {
    session = await createEmailSession({
      email,
      code,
      displayName: displayName || undefined,
      next: toSafeNextPath(formData.get("next")),
    });
  } catch (error) {
    if (isApiError(error, CONFLICT_STATUS, "NAME_REQUIRED"))
      return { ...keep, needsName: true, notice: error.message, error: undefined, field: undefined };
    if (isApiError(error, BAD_REQUEST_STATUS, "INVALID_NAME")) return { ...keep, field: "displayName", error: error.message };
    return { ...keep, field: "code", error: toErrorMessage(error, t.auth.codeVerifyFailed) };
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
