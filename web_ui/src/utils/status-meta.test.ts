// Tests the board column order.
import { describe, expect, it } from "vitest";

import { IDEA_COLUMNS } from "./status-meta";

describe("IDEA_COLUMNS", () => {
  it("should list the four board columns in lifecycle order", () => {
    expect(IDEA_COLUMNS).toEqual(["proposed", "discussing", "decided", "rejected"]);
  });
});
