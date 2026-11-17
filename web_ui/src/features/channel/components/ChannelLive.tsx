"use client";
// Listens to the channel's server-sent events and refreshes the page's server data when a new message arrives.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { toApiPath } from "@/lib/api/api-base-path";

/** Coalesces bursts of events into one refresh. */
const REFRESH_DELAY_MS = 150;

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
  // Only the seq at page load is used: a refresh must not reopen the stream.
  const afterSeq = useRef(lastSeq ?? 0);

  useEffect(() => {
    const streamPath = toApiPath(
      `/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/stream`,
    );
    const source = new EventSource(`${streamPath}?after=${afterSeq.current}`);
    let timer: number | undefined;
    const handleMessage = (event: MessageEvent<string>) => {
      const seq = Number(event.lastEventId);
      if (Number.isFinite(seq) && seq > afterSeq.current) afterSeq.current = seq;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
    };
    source.addEventListener("message", handleMessage);
    return () => {
      window.clearTimeout(timer);
      source.removeEventListener("message", handleMessage);
      source.close();
    };
  }, [workspaceId, channelId, router]);

  return null;
}
