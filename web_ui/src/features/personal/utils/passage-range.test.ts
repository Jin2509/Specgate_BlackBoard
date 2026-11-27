// Tests that a saved passage is found in rendered Markdown even when block boundaries add no characters.
import { describe, expect, it } from "vitest";

import { toPassageRange } from "./passage-range";

function renderInto(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

describe("toPassageRange", () => {
  it("should find a passage that spans list items, whose text has no space between them", () => {
    const root = renderInto("<ul><li>first point</li><li>second point</li></ul>");
    const range = toPassageRange(root, "first point\nsecond point");
    expect(range?.toString()).toBe("first pointsecond point");
    root.remove();
  });

  it("should find a passage that spans paragraphs", () => {
    const root = renderInto("<p>Run 40 tasks.</p><p>The result is clear.</p>");
    expect(toPassageRange(root, "Run 40 tasks.\n\nThe result is clear.")?.toString()).toBe("Run 40 tasks.The result is clear.");
    root.remove();
  });

  it("should ignore Markdown markers the selection keeps out of the rendered text", () => {
    const root = renderInto("<p>Use <strong>bold</strong> words</p>");
    expect(toPassageRange(root, "Use **bold** words")?.toString()).toBe("Use bold words");
    root.remove();
  });

  it("should return null when the passage is not in the text", () => {
    const root = renderInto("<p>Some answer</p>");
    expect(toPassageRange(root, "other words")).toBeNull();
    root.remove();
  });

  it("should skip text inside elements marked as not to be highlighted", () => {
    const root = renderInto("<p>Keep <span data-no-mark>copy me </span>this</p>");
    expect(toPassageRange(root, "Keep copy me this")).toBeNull();
    root.remove();
  });
});
