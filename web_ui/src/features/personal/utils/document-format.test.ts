// Tests the size and token labels shown next to attached files and answers.
import { describe, expect, it } from "vitest";

import { toFileSizeLabel, toUsageLabel } from "./document-format";

describe("toFileSizeLabel", () => {
  it("should show kilobytes for files under one megabyte", () => {
    expect(toFileSizeLabel(2048)).toBe("2 KB");
  });

  it("should show at least one kilobyte for tiny files", () => {
    expect(toFileSizeLabel(10)).toBe("1 KB");
  });

  it("should show megabytes with one decimal for larger files", () => {
    expect(toFileSizeLabel(3 * 1024 * 1024)).toBe("3 MB");
  });
});

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
