// Tests how the flat task list becomes a tree with progress counts.
import { describe, expect, it } from "vitest";

import type { Task } from "@/types/task";

import { toOpenTaskCount, toTaskTree } from "./task-tree";

function createTask(number: number, overrides: Partial<Task> = {}): Task {
  return {
    id: `tk_${number}`,
    number,
    parentNumber: null,
    body: `task ${number}`,
    status: "doing",
    assignee: { id: "u_lan", displayName: "Lan", initial: "L" },
    createdBy: "Lan",
    assignedBy: "Lan",
    createdAt: "2026-11-19T00:00:00Z",
    doneAt: null,
    ...overrides,
  };
}

describe("toTaskTree", () => {
  it("should nest subtasks under their parent in number order", () => {
    const tasks = [createTask(3, { parentNumber: 1 }), createTask(1), createTask(2), createTask(4, { parentNumber: 3 })];

    const tree = toTaskTree(tasks);

    expect(tree.map((node) => node.task.number)).toEqual([1, 2]);
    expect(tree[0].children.map((node) => node.task.number)).toEqual([3]);
    expect(tree[0].children[0].children[0].depth).toBe(3);
  });

  it("should count finished tasks anywhere below a task", () => {
    const tasks = [
      createTask(1),
      createTask(2, { parentNumber: 1, status: "done" }),
      createTask(3, { parentNumber: 1 }),
      createTask(4, { parentNumber: 3, status: "done" }),
    ];

    const [root] = toTaskTree(tasks);

    expect({ done: root.doneCount, total: root.totalCount }).toEqual({ done: 2, total: 3 });
  });

  it("should show a task at the top level when its parent is missing", () => {
    const tree = toTaskTree([createTask(5, { parentNumber: 9 })]);

    expect(tree.map((node) => node.task.number)).toEqual([5]);
  });
});

describe("toOpenTaskCount", () => {
  it("should count unfinished tasks whether or not someone holds them", () => {
    const tasks = [createTask(1), createTask(2, { assignee: null }), createTask(3, { status: "done" })];

    expect(toOpenTaskCount(tasks)).toBe(2);
  });
});
