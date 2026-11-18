// Tests which dot a channel name shows: mention over unread, live state over server state, none for the open channel.
import { describe, expect, it } from "vitest";

import { toChannelDot } from "./channel-dot";

const READ_CHANNEL = { id: "c1", unread: false, mentioned: false };
const UNREAD_CHANNEL = { id: "c1", unread: true, mentioned: false };
const MENTIONED_CHANNEL = { id: "c1", unread: true, mentioned: true };

describe("toChannelDot", () => {
  it("should show no dot when the channel is read", () => {
    expect(toChannelDot(READ_CHANNEL, undefined, false)).toBeUndefined();
  });

  it("should show the unread dot when there are unread messages", () => {
    expect(toChannelDot(UNREAD_CHANNEL, undefined, false)).toBe("unread");
  });

  it("should show the mention dot over the unread dot", () => {
    expect(toChannelDot(MENTIONED_CHANNEL, undefined, false)).toBe("mention");
  });

  it("should prefer the live state when the poll has answered", () => {
    expect(toChannelDot(READ_CHANNEL, [MENTIONED_CHANNEL], false)).toBe("mention");
    expect(toChannelDot(UNREAD_CHANNEL, [READ_CHANNEL], false)).toBeUndefined();
  });

  it("should never show a dot on the open channel", () => {
    expect(toChannelDot(MENTIONED_CHANNEL, [MENTIONED_CHANNEL], true)).toBeUndefined();
  });
});
