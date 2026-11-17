// Exposes the user-facing message catalog of the configured locale and placeholder formatting.
import { appConfig, type Locale } from "@/config/app-config";
import englishCatalog from "@/locales/en.json";
import vietnameseCatalog from "@/locales/vi.json";

export type Messages = typeof vietnameseCatalog;

const englishMessages: Messages = englishCatalog;
const catalogs: Record<Locale, Messages> = { vi: vietnameseCatalog, en: englishMessages };

export const t: Messages = catalogs[appConfig.locale];

export const locale: Locale = appConfig.locale;

/** Replace `{name}` placeholders in a catalog message. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
