// Tests the token label shown next to answers.
import { describe, expect, it } from "vitest";

import { toUsageLabel } from "./document-format";

describe("toUsageLabel", () => {
  it("should include input, cached and output tokens", () => {
    const label = toUsageLabel({ inputTokens: 120, cachedInputTokens: 100, cacheWriteTokens: 0, outputTokens: 30 });
    expect(label).toContain("120");
    expect(label).toContain("100");
    expect(label).toContain("30");
  });

  it("should treat missing output tokens as zero", () => {
    expect(toUsageLabel({ inputTokens: 5, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: null })).toContain("0");
  });
});
