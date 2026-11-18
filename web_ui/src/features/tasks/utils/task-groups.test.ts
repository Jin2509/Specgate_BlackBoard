// Tests how the task board is split into its groups.
import { describe, expect, it } from "vitest";

import type { Task } from "@/types/task";

import { toOpenTaskCount, toTaskGroups } from "./task-groups";

function createTask(number: number, overrides: Partial<Task> = {}): Task {
  return {
    id: `tk_${number}`,
    number,
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

describe("toTaskGroups", () => {
  it("should separate tasks in progress, tasks nobody holds and finished tasks", () => {
    const tasks = [createTask(1), createTask(2, { assignee: null }), createTask(3, { status: "done" })];

    const groups = toTaskGroups(tasks);

    expect(groups.doing.map((task) => task.number)).toEqual([1]);
    expect(groups.unassigned.map((task) => task.number)).toEqual([2]);
    expect(groups.done.map((task) => task.number)).toEqual([3]);
  });
});

describe("toOpenTaskCount", () => {
  it("should count unfinished tasks whether or not someone holds them", () => {
    const tasks = [createTask(1), createTask(2, { assignee: null }), createTask(3, { status: "done" })];

    expect(toOpenTaskCount(tasks)).toBe(2);
  });
});
