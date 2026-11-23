// Turns a backend error code into the user-facing sentence of the current locale, keeping specific backend text otherwise.
import { t } from "@/lib/i18n";

const PROVIDER_CODE_PREFIX = /^(KEY|PROVIDER)_/;
const HTTP_CODE = /^HTTP_(\d{3})$/;
const SERVER_ERROR_STATUS_MIN = 500;

const MESSAGES_BY_CODE: Readonly<Record<string, string>> = {
  INVALID_KEY: t.errors.invalidKey,
  QUOTA: t.errors.quota,
  NETWORK: t.errors.providerNetwork,
  TIMEOUT: t.errors.providerTimeout,
  MODEL: t.errors.model,
  CONTEXT: t.errors.context,
  BAD_URL: t.errors.badUrl,
  PROVIDER: t.errors.provider,
  BACKEND_UNREACHABLE: t.errors.backendUnreachable,
  UNAUTHENTICATED: t.errors.sessionExpired,
  INVALID_REQUEST: t.errors.invalidRequest,
};

const MESSAGES_BY_HTTP_STATUS: Readonly<Record<number, string>> = {
  401: t.errors.sessionExpired,
  403: t.errors.forbidden,
  404: t.errors.notFound,
  429: t.errors.tooManyRequests,
};

function toCanonicalCode(code: string): string {
  return code.toUpperCase().replaceAll("-", "_").replace(PROVIDER_CODE_PREFIX, "");
}

/** Return the catalog sentence for a known code, otherwise the backend's own message or the fallback. */
export function toErrorText(code: string | undefined, backendMessage: string | undefined, fallback: string): string {
  if (code) {
    const known = MESSAGES_BY_CODE[toCanonicalCode(code)];
    if (known) return known;
    const httpStatus = HTTP_CODE.exec(code)?.[1];
    if (httpStatus) {
      const status = Number(httpStatus);
      return MESSAGES_BY_HTTP_STATUS[status] ?? (status >= SERVER_ERROR_STATUS_MIN ? t.errors.backendFailed : fallback);
    }
  }
  return backendMessage || fallback;
}
