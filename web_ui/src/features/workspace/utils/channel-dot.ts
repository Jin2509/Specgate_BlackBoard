// Picks the dot a channel name shows in the sidebar: a stronger one for a mention, a plain one for unread messages.
import type { NavItemDot } from "@/components/NavItem";
import type { Channel } from "@/types/workspace";

type ChannelReadState = Pick<Channel, "id" | "unread" | "mentioned">;

/** Live state wins over server-rendered state; the open channel is read as it loads, so it never shows a dot. */
export function toChannelDot(
  channel: ChannelReadState,
  liveChannels: readonly ChannelReadState[] | undefined,
  isActive: boolean,
): NavItemDot | undefined {
  if (isActive) return undefined;
  const state = liveChannels?.find((live) => live.id === channel.id) ?? channel;
  if (state.mentioned) return "mention";
  return state.unread ? "unread" : undefined;
}
