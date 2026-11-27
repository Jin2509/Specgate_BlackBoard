"use client";
// Refreshes the page's server data when a matching realtime event arrives, polling only while the socket is down.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useRealtimeEvent, useRealtimeStatus } from "@/hooks/use-realtime";
import type { RealtimeEventType } from "@/types/realtime";

const DEFAULT_INTERVAL_MS = 30_000;
const REFRESH_DELAY_MS = 150;

export function AutoRefresh({
  eventType,
  match = {},
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  /** The pushed event that means this page is out of date. */
  eventType: RealtimeEventType;
  /** Event fields that must equal these values, e.g. `{ requestId }`. */
  match?: Record<string, string>;
  /** Poll interval while the realtime socket is not open. */
  intervalMs?: number;
}) {
  const router = useRouter();
  const status = useRealtimeStatus();
  const timerRef = useRef<number | undefined>(undefined);

  useRealtimeEvent((event) => {
    if (event.type !== eventType) return;
    const fields = event as unknown as Record<string, unknown>;
    if (!Object.entries(match).every(([key, value]) => fields[key] === value)) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
  });

  useEffect(() => {
    if (status === "open") return;
    const timerId = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timerId);
  }, [status, router, intervalMs]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return null;
}
