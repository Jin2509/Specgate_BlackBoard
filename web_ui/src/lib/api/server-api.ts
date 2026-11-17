// Calls the backend with the session token of the current request; server components and actions only.
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/config/session-cookie";

import { callJson, type CallInit } from "./http-client";

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function callApi<T>(resourcePath: string, init: Omit<CallInit, "token"> = {}): Promise<T> {
  return callJson<T>(resourcePath, { ...init, token: await getSessionToken() });
}
