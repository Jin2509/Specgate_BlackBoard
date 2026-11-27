// Classifies and converts task deadlines between the server's UTC timestamps and the browser's local date-time input.
import type { TaskStatus } from "@/types/task";

/** A deadline closer than this is flagged as coming soon. */
const SOON_WINDOW_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type DeadlineTone = "overdue" | "soon" | "later" | "done";

export function toDeadlineTone(dueAt: string, status: TaskStatus, now: Date): DeadlineTone {
  if (status === "done") return "done";
  const remainingMs = new Date(dueAt).getTime() - now.getTime();
  if (remainingMs <= 0) return "overdue";
  return remainingMs <= SOON_WINDOW_MS ? "soon" : "later";
}

/** The value a `datetime-local` input shows for a UTC timestamp, in the browser's time zone. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS);
  return local.toISOString().slice(0, 16);
}

/** The UTC timestamp of a `datetime-local` value read in the browser's time zone; null when empty or invalid. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
