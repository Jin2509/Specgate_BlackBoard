// Tests that a text download clicks an attached link and keeps the blob alive until the browser has read it.
import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadTextFile } from "./download-text-file";

describe("downloadTextFile", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should click a link that is in the document and revoke the blob only later", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    let wasAttached = false;
    let savedName = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      wasAttached = document.body.contains(this);
      savedName = this.download;
    });

    downloadTextFile("brief.md", "# Brief", "text/markdown");

    expect(wasAttached).toBe(true);
    expect(savedName).toBe("brief.md");
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
