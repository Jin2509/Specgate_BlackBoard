// Calls the FastAPI backend from the Next.js server and turns error bodies into typed ApiError values.
import { appConfig } from "@/config/app-config";
import { t } from "@/lib/i18n";

import { toApiPath } from "./api-base-path";

const BACKEND_UNREACHABLE = "BACKEND_UNREACHABLE";
const SERVICE_UNAVAILABLE_STATUS = 503;
const NO_CONTENT_STATUS = 204;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface CallInit {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  query?: Record<string, string | undefined>;
}

export function isApiError(error: unknown, status?: number, code?: string): error is ApiError {
  return (
    error instanceof ApiError && (status === undefined || error.status === status) && (code === undefined || error.code === code)
  );
}

/** Call a backend resource path such as "/me"; the version prefix is added here. */
export async function request(resourcePath: string, init: CallInit = {}): Promise<Response> {
  const url = new URL(toApiPath(resourcePath), appConfig.backendUrl);
  for (const [key, value] of Object.entries(init.query ?? {})) if (value) url.searchParams.set(key, value);
  try {
    return await fetch(url, {
      method: init.method ?? "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(SERVICE_UNAVAILABLE_STATUS, BACKEND_UNREACHABLE, t.errors.backendUnreachable);
  }
}

interface ErrorBody {
  error?: { code?: unknown; message?: unknown };
}

/** Read the backend error body `{ error: { code, message, details } }` into an ApiError. */
export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  const code = typeof body?.error?.code === "string" ? body.error.code : `HTTP_${response.status}`;
  const message = typeof body?.error?.message === "string" ? body.error.message : t.errors.backendFailed;
  return new ApiError(response.status, code, message);
}

/** Call the backend and parse JSON; any error status throws ApiError, 204 resolves to undefined. */
export async function callJson<T>(resourcePath: string, init: CallInit = {}): Promise<T> {
  const response = await request(resourcePath, init);
  if (!response.ok) throw await toApiError(response);
  if (response.status === NO_CONTENT_STATUS) return undefined as T;
  return (await response.json()) as T;
}

/** Return the backend's own message for an ApiError, or the fallback for anything else. */
export function toErrorMessage(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback;
}
