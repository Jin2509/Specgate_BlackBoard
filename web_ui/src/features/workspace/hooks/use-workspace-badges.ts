"use client";
// Keeps the unread, mention and join-request dots of every shared workspace current from pushed realtime events.
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { toApiPath } from "@/lib/api/api-base-path";
import { getRealtimeClient } from "@/lib/realtime/realtime-client";
import type { RealtimeEvent, RealtimeStatus } from "@/types/realtime";
import type { RailWorkspace } from "@/types/workspace";

/** Used only while the realtime socket is down. */
const FALLBACK_POLL_INTERVAL_MS = 30_000;
/** A burst of messages in a busy channel asks for the dots once. */
const REFRESH_DELAY_MS = 500;
const BADGES_PATH = toApiPath("/me/badges");
const BADGE_EVENT_TYPES: ReadonlySet<RealtimeEvent["type"]> = new Set([
  "realtime.connection.opened",
  "workspace.channel.updated",
  "join.request.changed",
  "workspace.membership.changed",
]);

export type BadgesByWorkspaceId = ReadonlyMap<string, RailWorkspace>;

let snapshot: BadgesByWorkspaceId | null = null;
const listeners = new Set<() => void>();
let pollTimerId: number | undefined;
let refreshTimerId: number | undefined;
let stopListening: (() => void) | undefined;
let stopStatus: (() => void) | undefined;

async function refreshBadges(): Promise<void> {
  if (document.visibilityState !== "visible") return;
  try {
    const response = await fetch(BADGES_PATH, { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { workspaces: RailWorkspace[] };
    snapshot = new Map(body.workspaces.map((workspace) => [workspace.id, workspace]));
    listeners.forEach((listener) => listener());
  } catch {
    // A missed refresh only delays the dots; the next event or page load brings them back.
  }
}

function refreshSoon(): void {
  window.clearTimeout(refreshTimerId);
  refreshTimerId = window.setTimeout(() => void refreshBadges(), REFRESH_DELAY_MS);
}

function handleVisibilityChange(): void {
  // Events are skipped while hidden, so catch up once the tab is seen again.
  if (document.visibilityState === "visible") void refreshBadges();
}

function followStatus(status: RealtimeStatus): void {
  window.clearInterval(pollTimerId);
  pollTimerId = undefined;
  if (status !== "open") pollTimerId = window.setInterval(() => void refreshBadges(), FALLBACK_POLL_INTERVAL_MS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    const client = getRealtimeClient();
    stopListening = client.listen((event) => {
      if (BADGE_EVENT_TYPES.has(event.type)) refreshSoon();
    });
    stopStatus = client.listenStatus(followStatus);
    followStatus(client.status);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    stopListening?.();
    stopStatus?.();
    window.clearInterval(pollTimerId);
    window.clearTimeout(refreshTimerId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

/** Live dots by workspace id, or null until the first answer; callers then fall back to server-rendered data. */
export function useWorkspaceBadges(): BadgesByWorkspaceId | null {
  const pathname = usePathname();
  // Opening a channel reads it on the server, so a navigation is the moment its dot may have gone.
  useEffect(() => {
    void refreshBadges();
  }, [pathname]);
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
