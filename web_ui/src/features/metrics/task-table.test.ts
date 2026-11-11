// Test lọc và sắp xếp bảng tác vụ.
import { describe, expect, it } from "vitest";
import { getTaskResults } from "@/lib/mock/queries";
import { filterTasks } from "./task-table";

describe("filterTasks", () => {
  const tasks = getTaskResults();

  it("lọc tác vụ đóng góp và sắp giảm dần theo vi phạm", () => {
    const rows = filterTasks(tasks, "contributing", true);
    expect(rows.every((t) => t.contributing)).toBe(true);
    expect(rows.map((t) => t.violations)).toEqual([...rows.map((t) => t.violations)].sort((a, b) => b - a));
  });

  it("không làm đổi thứ tự của mảng gốc", () => {
    const before = tasks.map((t) => t.taskId);
    filterTasks(tasks, "all", false);
    expect(tasks.map((t) => t.taskId)).toEqual(before);
  });
});
