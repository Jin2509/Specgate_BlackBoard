// Tests how a task deadline is classified and converted for the local date-time input.
import { describe, expect, it } from "vitest";

import { fromLocalInputValue, toDeadlineTone, toLocalInputValue } from "./deadline";

const NOW = new Date("2026-12-01T10:00:00Z");

describe("toDeadlineTone", () => {
  it("should mark a passed deadline of an unfinished task as overdue", () => {
    expect(toDeadlineTone("2026-12-01T09:59:00Z", "doing", NOW)).toBe("overdue");
  });

  it("should flag a deadline within a day as coming soon", () => {
    expect(toDeadlineTone("2026-12-02T09:00:00Z", "todo", NOW)).toBe("soon");
  });

  it("should leave a distant deadline plain", () => {
    expect(toDeadlineTone("2026-12-05T10:00:00Z", "todo", NOW)).toBe("later");
  });

  it("should never call a finished task overdue", () => {
    expect(toDeadlineTone("2026-11-01T10:00:00Z", "done", NOW)).toBe("done");
  });
});

describe("local input conversion", () => {
  it("should give back the same moment after a round trip through the input value", () => {
    const iso = "2026-12-01T10:30:00.000Z";
    expect(fromLocalInputValue(toLocalInputValue(iso))).toBe(iso);
  });

  it("should read an empty or invalid input as no deadline", () => {
    expect(toLocalInputValue(null)).toBe("");
    expect(fromLocalInputValue("")).toBeNull();
    expect(fromLocalInputValue("not a date")).toBeNull();
  });
});
