// Tests the "trim only, never edit" rule of a highlight for the agent.
import { describe, expect, it } from "vitest";

import { isNarrowing } from "./selection-segments";

describe("isNarrowing", () => {
  it("should accept trimming both ends even with different whitespace", () => {
    expect(isNarrowing("The runner needs three things: data, seed", "data,\n  seed")).toBe(true);
  });

  it("should reject added or changed words", () => {
    expect(isNarrowing("data, seed", "data, seed, GPU")).toBe(false);
    expect(isNarrowing("data, seed", "data and seed")).toBe(false);
    expect(isNarrowing("data", "   ")).toBe(false);
  });
});
