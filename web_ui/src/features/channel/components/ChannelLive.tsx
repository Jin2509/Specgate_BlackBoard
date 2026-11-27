"use client";
// Follows the channel over the realtime WebSocket and refreshes the page's server data when a message arrives.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useChannelSubscription, useRealtimeEvent, useRealtimeStatus } from "@/hooks/use-realtime";

/** Coalesces bursts of events into one refresh. */
const REFRESH_DELAY_MS = 150;
/** Used only while the socket is down, so the channel still moves. */
const FALLBACK_REFRESH_MS = 30_000;

export function ChannelLive({
  workspaceId,
  channelId,
  lastSeq,
}: {
  workspaceId: string;
  channelId: string;
  lastSeq: number | null;
}) {
  const router = useRouter();
  const status = useRealtimeStatus();
  const timerRef = useRef<number | undefined>(undefined);
  const wasOpenRef = useRef(false);

  useChannelSubscription(workspaceId, channelId, lastSeq ?? 0);
  useRealtimeEvent((event) => {
    const isThisChannel = event.type === "channel.message.created" && event.message.channelId === channelId;
    const isReplayDone = event.type === "channel.subscription.confirmed" && event.channelId === channelId;
    if (!isThisChannel && !(isReplayDone && wasOpenRef.current)) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
  });

  useEffect(() => {
    // After a reconnect the replay restores messages, but board cards and reactions may also have moved.
    if (status === "open") wasOpenRef.current = true;
  }, [status]);

  useEffect(() => {
    if (status === "open") return;
    const timerId = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, FALLBACK_REFRESH_MS);
    return () => window.clearInterval(timerId);
  }, [status, router]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return null;
}
