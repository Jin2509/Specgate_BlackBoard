// Tests that passage labels match the backend rules for whole, partial and edited quotes.
import { describe, expect, it } from "vitest";

import { format, t } from "@/lib/i18n";

import { toEllipsizedText, toExcerpt, toPassageStatus, toSpeakerLabel } from "./excerpt";

const ANSWER = "Do not use method X because it uses too much RAM. Run 40 more tasks. The result will be clearer.";
const SPEAKER = "Claude of Lan";

describe("toExcerpt", () => {
  it("should not mark a whole sentence as partial and only cut both ends", () => {
    expect(toExcerpt(ANSWER, "Run 40 more tasks.")).toEqual({ cutStart: true, cutEnd: true, partial: false });
  });

  it("should mark a mid-sentence cut as partial", () => {
    expect(toExcerpt(ANSWER, "use method X").partial).toBe(true);
  });

  it("should treat the whole answer as uncut", () => {
    expect(toExcerpt(ANSWER, ANSWER)).toEqual({ cutStart: false, cutEnd: false, partial: false });
  });

  it("should treat a whole list line as uncut", () => {
    const markdown = "Steps:\n- run HumanEval/38 with seed 0.842\n- compare";
    expect(toExcerpt(markdown, "run HumanEval/38 with seed 0.842").partial).toBe(false);
  });
});

describe("toSpeakerLabel", () => {
  it("should label a passage with words removed as edited", () => {
    const status = toPassageStatus(ANSWER, ANSWER, "Do not use X because it uses too much RAM.");
    expect(status.edited).toBe(true);
    expect(toSpeakerLabel(SPEAKER, "Lan", status)).toBe(format(t.highlight.editedBy, { speaker: SPEAKER, editor: "Lan" }));
  });

  it("should label a partial passage and add ellipses at the cuts", () => {
    const status = toPassageStatus(ANSWER, ANSWER, "use method X");
    expect(toSpeakerLabel(SPEAKER, "Lan", status)).toBe(format(t.highlight.partialSuffix, { speaker: SPEAKER }));
    expect(toEllipsizedText("use method", status)).toBe("…use method…");
  });
});
