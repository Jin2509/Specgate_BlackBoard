// Holds the short status messages shown in the corner and lets any client code push or dismiss one.
export type ToastTone = "error" | "success";

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  text: string;
}

const VISIBLE_TOAST_MAX = 3;
const NO_TOASTS: readonly ToastMessage[] = [];

let toasts: readonly ToastMessage[] = NO_TOASTS;
let nextToastId = 1;
const listeners = new Set<() => void>();

function publish(next: readonly ToastMessage[]): void {
  toasts = next;
  for (const listener of listeners) listener();
}

/** Show a short message; the same text already on screen is moved to the front instead of stacking. */
export function showToast(tone: ToastTone, text: string): void {
  if (!text) return;
  const others = toasts.filter((toast) => toast.text !== text);
  publish([...others, { id: nextToastId++, tone, text }].slice(-VISIBLE_TOAST_MAX));
}

export function showErrorToast(text: string): void {
  showToast("error", text);
}

export function showSuccessToast(text: string): void {
  showToast("success", text);
}

export function dismissToast(id: number): void {
  publish(toasts.filter((toast) => toast.id !== id));
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listToasts(): readonly ToastMessage[] {
  return toasts;
}

export function listServerToasts(): readonly ToastMessage[] {
  return NO_TOASTS;
}
