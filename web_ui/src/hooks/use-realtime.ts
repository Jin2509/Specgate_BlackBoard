"use client";
// Connects components to the tab's realtime WebSocket: pushed events, connection status and channel subscriptions.
import { useEffect, useRef, useSyncExternalStore } from "react";

import { getRealtimeClient } from "@/lib/realtime/realtime-client";
import type { RealtimeEvent, RealtimeStatus } from "@/types/realtime";

/** Call the handler for every pushed event while the component is mounted. */
export function useRealtimeEvent(handler: (event: RealtimeEvent) => void): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => getRealtimeClient().listen((event) => handlerRef.current(event)), []);
}

function subscribeStatus(onChange: () => void): () => void {
  return getRealtimeClient().listenStatus(onChange);
}

/** "open" while events arrive live; any other value means callers should fall back to polling. */
export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(
    subscribeStatus,
    () => getRealtimeClient().status,
    () => "closed",
  );
}

/** Receive the channel's messages while mounted, replaying those posted after `afterSeq`. */
export function useChannelSubscription(workspaceId: string, channelId: string, afterSeq: number): void {
  // Only the seq at mount matters: the client tracks newer ones itself, and a refresh must not resubscribe.
  const afterSeqRef = useRef(afterSeq);
  useEffect(() => getRealtimeClient().subscribeChannel(workspaceId, channelId, afterSeqRef.current), [workspaceId, channelId]);
}
