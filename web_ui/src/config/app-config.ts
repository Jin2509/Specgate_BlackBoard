// Reads deploy-specific settings from the environment once, when the module loads.
export type Locale = "vi" | "en";

const SUPPORTED_LOCALES: readonly Locale[] = ["vi", "en"];
const DEFAULT_BACKEND_URL = "http://localhost:8000";
const DEFAULT_LOCALE: Locale = "vi";

function toLocale(value: string | undefined): Locale {
  return SUPPORTED_LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}

export const appConfig = {
  backendUrl: process.env.SPECGATE_BACKEND_URL ?? DEFAULT_BACKEND_URL,
  locale: toLocale(process.env.NEXT_PUBLIC_SPECGATE_LOCALE),
} as const;
