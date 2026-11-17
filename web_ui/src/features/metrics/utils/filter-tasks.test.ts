// Tests filtering and sorting of the task violation table.
import { describe, expect, it } from "vitest";

import { sampleTasks } from "@/test/fixtures/metrics";

import { listFilteredTasks } from "./filter-tasks";

describe("listFilteredTasks", () => {
  it("should keep contributing tasks sorted by violations, highest first", () => {
    const rows = listFilteredTasks(sampleTasks, "contributing", "descending");
    expect(rows.every((task) => task.contributing)).toBe(true);
    expect(rows.map((task) => task.violations)).toEqual(
      [...rows.map((task) => task.violations)].sort((first, second) => second - first),
    );
  });

  it("should not reorder the input array", () => {
    const before = sampleTasks.map((task) => task.taskId);
    listFilteredTasks(sampleTasks, "all", "ascending");
    expect(sampleTasks.map((task) => task.taskId)).toEqual(before);
  });
});
