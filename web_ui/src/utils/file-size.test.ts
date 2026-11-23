// Tests the size label shown next to uploaded files.
import { describe, expect, it } from "vitest";

import { toFileSizeLabel } from "./file-size";

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
