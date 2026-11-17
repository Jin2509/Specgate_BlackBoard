// Tests that module commands appear only in workspaces with that module attached.
import { describe, expect, it } from "vitest";

import { listCommands } from "./commands";

describe("listCommands", () => {
  it("should list only the core commands when no module is attached", () => {
    const names = listCommands([]).map((command) => command.name);
    expect(names).toEqual(["/idea", "/pin", "/note", "/decide", "/summarize", "/brief", "/help"]);
  });

  it("should add /stats and /task when the paper metrics module is attached", () => {
    const names = listCommands(["adom"]).map((command) => command.name);
    expect(names).toEqual(expect.arrayContaining(["/stats", "/task"]));
  });
});
