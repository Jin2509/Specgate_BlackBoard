// Tests that verdict tones never let "insufficient data" look like a pass, and the board column order.
import { describe, expect, it } from "vitest";

import { IDEA_COLUMNS, VERDICT_META } from "./status-meta";
import { TONE_CLASSES } from "./tone";

describe("VERDICT_META", () => {
  it("should never give insufficient data the tone of a pass", () => {
    const passTone = VERDICT_META.PASS.tone;
    const insufficientTone = VERDICT_META.INSUFFICIENT_DATA.tone;
    expect(insufficientTone).not.toBe(passTone);
    expect(TONE_CLASSES[insufficientTone].text).not.toBe(TONE_CLASSES[passTone].text);
  });

  it("should give every verdict its own tone", () => {
    const tones = Object.values(VERDICT_META).map((meta) => meta.tone);
    expect(new Set(tones).size).toBe(tones.length);
  });
});

describe("IDEA_COLUMNS", () => {
  it("should list the four board columns in lifecycle order", () => {
    expect(IDEA_COLUMNS).toEqual(["proposed", "discussing", "decided", "rejected"]);
  });
});
