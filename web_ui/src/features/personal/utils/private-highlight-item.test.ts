// Tests when an edited private highlight counts as a change of the agent's words.
import { describe, expect, it } from "vitest";

import { isAgentTextEdited } from "./private-highlight-item";

const agentItem = { speakerKind: "agent" as const, originalText: "Run 40 more tasks.\nThe result will be clearer." };

describe("isAgentTextEdited", () => {
  it("should not count trimming as an edit, whatever the whitespace", () => {
    expect(isAgentTextEdited(agentItem, "40 more tasks. The result")).toBe(false);
  });

  it("should count changed words as an edit", () => {
    expect(isAgentTextEdited(agentItem, "Run 50 more tasks.")).toBe(true);
  });

  it("should never mark the user's own words as edited", () => {
    expect(isAgentTextEdited({ ...agentItem, speakerKind: "human" as const }, "anything")).toBe(false);
  });
});
