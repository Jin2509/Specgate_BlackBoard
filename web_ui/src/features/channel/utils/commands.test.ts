// Tests that a channel offers exactly the channel commands of the flow.
import { describe, expect, it } from "vitest";

import { COMMANDS } from "./commands";

describe("COMMANDS", () => {
  it("should list the channel commands in menu order", () => {
    const names = COMMANDS.map((command) => command.name);
    expect(names).toEqual(["/idea", "/note", "/pin", "/decide", "/summarize", "/brief", "/task", "/help"]);
  });
});
