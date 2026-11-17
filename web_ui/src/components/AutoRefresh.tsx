"use client";
// Refreshes the page's server data on an interval while the tab is visible, as a fallback to live streams.
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DEFAULT_INTERVAL_MS = 3000;

export function AutoRefresh({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timerId);
  }, [router, intervalMs]);
  return null;
}
