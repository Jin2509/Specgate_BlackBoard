"use client";
// Polls the unread, mention and join-request dots of every shared workspace so the rail and channel list stay current.
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { toApiPath } from "@/lib/api/api-base-path";
import type { RailWorkspace } from "@/types/workspace";

const POLL_INTERVAL_MS = 10_000;
const BADGES_PATH = toApiPath("/me/badges");

export type BadgesByWorkspaceId = ReadonlyMap<string, RailWorkspace>;

let snapshot: BadgesByWorkspaceId | null = null;
const listeners = new Set<() => void>();
let timerId: number | undefined;

async function refreshBadges(): Promise<void> {
  if (document.visibilityState !== "visible") return;
  try {
    const response = await fetch(BADGES_PATH, { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { workspaces: RailWorkspace[] };
    snapshot = new Map(body.workspaces.map((workspace) => [workspace.id, workspace]));
    listeners.forEach((listener) => listener());
  } catch {
    // A missed poll only delays the dots; the next interval or page load brings them back.
  }
}

function handleVisibilityChange(): void {
  void refreshBadges();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    timerId = window.setInterval(() => void refreshBadges(), POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.clearInterval(timerId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

/** Live dots by workspace id, or null until the first poll answers; callers then fall back to server-rendered data. */
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
