// Tests that the task dialog creates a task together with the smaller tasks listed under it.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";

import { TaskCreateDialog } from "./TaskCreateDialog";
import { createTask } from "../api/task-actions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../api/task-actions", () => ({ createTask: vi.fn(async () => ({ ok: true })) }));

const MEMBERS = [] as TeamMember[];

function renderDialog(onOpenChange = vi.fn()) {
  render(<TaskCreateDialog workspaceId="w1" members={MEMBERS} viewerId="lan" parentNumber={3} onOpenChange={onOpenChange} />);
  return onOpenChange;
}

describe("TaskCreateDialog", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(createTask).mockClear();
  });

  it("should create the task with its non-empty smaller tasks under the chosen parent", async () => {
    const onOpenChange = renderDialog();
    fireEvent.change(screen.getByLabelText(t.tasks.bodyLabel), { target: { value: " Read papers " } });
    fireEvent.click(screen.getByRole("button", { name: t.tasks.addSubtask }));
    fireEvent.click(screen.getByRole("button", { name: t.tasks.addSubtask }));
    fireEvent.change(screen.getByLabelText(format(t.tasks.subtaskLabel, { index: 1 })), { target: { value: " Paper A " } });
    fireEvent.click(screen.getByRole("button", { name: t.tasks.createSubmit }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(createTask).toHaveBeenCalledWith({
      workspaceId: "w1",
      body: "Read papers",
      assigneeId: "",
      parentNumber: 3,
      dueAt: null,
      subtasks: [{ body: "Paper A", dueAt: null }],
    });
  });

  it("should show the failure inside the dialog and keep it open", async () => {
    vi.mocked(createTask).mockResolvedValueOnce({ ok: false, error: "The board is locked." });
    const onOpenChange = renderDialog();
    fireEvent.change(screen.getByLabelText(t.tasks.bodyLabel), { target: { value: "Read papers" } });
    fireEvent.click(screen.getByRole("button", { name: t.tasks.createSubmit }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The board is locked.");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("should send the chosen deadline as a UTC timestamp", async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(t.tasks.bodyLabel), { target: { value: "Submit report" } });
    fireEvent.change(screen.getByLabelText(t.tasks.dueFieldLabel), { target: { value: "2026-12-05T17:00" } });
    fireEvent.click(screen.getByRole("button", { name: t.tasks.createSubmit }));

    await waitFor(() => expect(createTask).toHaveBeenCalled());
    expect(vi.mocked(createTask).mock.calls[0][0].dueAt).toBe(new Date("2026-12-05T17:00").toISOString());
  });

  it("should not create anything while the task has no name", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: t.tasks.createSubmit })).toBeDisabled();
  });

  it("should remove a smaller task row", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: t.tasks.addSubtask }));
    fireEvent.click(screen.getByRole("button", { name: format(t.tasks.removeSubtask, { index: 1 }) }));
    expect(screen.queryByLabelText(format(t.tasks.subtaskLabel, { index: 1 }))).not.toBeInTheDocument();
  });
});
