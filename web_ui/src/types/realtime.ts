// Defines the events the backend pushes over the realtime WebSocket.
import type { Message } from "./message";

export type RealtimeStatus = "connecting" | "open" | "closed" | "unauthenticated";

export type RealtimeEvent =
  | { type: "realtime.connection.opened" }
  | { type: "channel.message.created"; message: Message }
  | { type: "channel.subscription.confirmed"; channelId: string; channelRef: string; lastSeq: number }
  | { type: "channel.subscription.refused"; channelId: string }
  | { type: "workspace.channel.updated"; workspaceId: string; channelId: string }
  | { type: "join.request.changed"; workspaceId: string; requestId: string; status: string }
  | { type: "workspace.membership.changed"; workspaceId: string };

export type RealtimeEventType = RealtimeEvent["type"];
