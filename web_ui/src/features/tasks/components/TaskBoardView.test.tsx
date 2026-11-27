// Tests who sees which task board action: owners add and lock, members claim waiting tasks, locks and deadlines show.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";

import { TaskBoardView } from "./TaskBoardView";
import type { TaskView } from "../types/task-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../api/task-actions", () => ({
  claimTask: vi.fn(),
  deleteTask: vi.fn(),
  releaseTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskItemLock: vi.fn(),
  updateTaskLock: vi.fn(),
  updateTaskStatus: vi.fn(),
}));

const MEMBERS = [] as TeamMember[];

function createTask(number: number, overrides: Partial<TaskView> = {}): TaskView {
  return {
    id: `tk_${number}`,
    number,
    parentNumber: null,
    body: `task ${number}`,
    status: "todo",
    locked: false,
    dueAt: null,
    isOverdue: false,
    assignee: null,
    createdBy: "Lan",
    assignedBy: null,
    createdAt: "2026-11-27T00:00:00Z",
    doneAt: null,
    dueLabel: "",
    deadlineTone: null,
    ...overrides,
  };
}

function renderBoard(tasks: TaskView[], isOwner: boolean) {
  render(
    <TaskBoardView
      workspaceId="w1"
      board={{ locked: false, tasks }}
      members={MEMBERS}
      viewerId="long"
      isOwner={isOwner}
      joinCode={null}
    />,
  );
}

function rowOf(number: number) {
  return screen.getByText(`task ${number}`).closest("li")!;
}

describe("TaskBoardView", () => {
  afterEach(cleanup);

  it("should let a member claim a waiting task but not add one", () => {
    renderBoard([createTask(1)], false);
    expect(within(rowOf(1)).getByRole("button", { name: t.tasks.claim })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t.tasks.add })).not.toBeInTheDocument();
  });

  it("should show a locked task as locked and not claimable", () => {
    renderBoard([createTask(1, { locked: true })], false);
    expect(within(rowOf(1)).getByText(t.tasks.lockedBadge)).toBeInTheDocument();
    expect(within(rowOf(1)).queryByRole("button", { name: t.tasks.claim })).not.toBeInTheDocument();
  });

  it("should show an overdue deadline clearly", () => {
    renderBoard([createTask(1, { dueAt: "2026-11-26T10:00:00Z", dueLabel: "26/11 17:00", deadlineTone: "overdue" })], false);
    expect(within(rowOf(1)).getByText(format(t.tasks.dueOverdue, { time: "26/11 17:00" }))).toBeInTheDocument();
  });

  it("should let the owner add tasks", () => {
    renderBoard([], true);
    expect(screen.getByRole("button", { name: t.tasks.add })).toBeInTheDocument();
  });
});
