// Formats backend ISO timestamps for display; call only on the server so hydration never sees a timezone shift.
import { locale } from "@/lib/i18n";

const INTL_LOCALE = locale === "vi" ? "vi-VN" : "en-GB";

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format as "14:05". */
export function toClock(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? date.toLocaleTimeString(INTL_LOCALE, { hour: "2-digit", minute: "2-digit" }) : "";
}

/** Format as "12/11 14:05". */
export function toDayClock(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? `${date.toLocaleDateString(INTL_LOCALE, { day: "2-digit", month: "2-digit" })} ${toClock(iso)}` : "";
}

/** Format as "12/11/2026 14:05". */
export function toDateClock(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date
    ? `${date.toLocaleDateString(INTL_LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" })} ${toClock(iso)}`
    : "";
}
