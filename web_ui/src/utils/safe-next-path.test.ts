// Tests that only in-app paths are accepted as post-login destinations.
import { describe, expect, it } from "vitest";

import { toSafeNextPath } from "./safe-next-path";

describe("toSafeNextPath", () => {
  it("should keep in-app paths", () => {
    expect(toSafeNextPath("/join/r1")).toBe("/join/r1");
  });

  it("should reject other origins and non-strings", () => {
    expect(toSafeNextPath("//evil.com")).toBeUndefined();
    expect(toSafeNextPath("https://evil.com")).toBeUndefined();
    expect(toSafeNextPath(null)).toBeUndefined();
  });
});
