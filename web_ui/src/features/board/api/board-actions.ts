"use server";
// Adds board cards, moves ideas to discussion, decides or rejects them and builds the summary.
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { BoardItem, BoardItemKind, Brief, Decision } from "@/types/board";

export type BoardOutcome<T> = { ok: true; value: T } | { ok: false; error: string };

function toBoardPath(workspaceId: string): string {
  return `/workspaces/${encodeURIComponent(workspaceId)}/board`;
}

async function runAction<T>(fallbackMessage: string, call: () => Promise<T>): Promise<BoardOutcome<T>> {
  await requireSession();
  try {
    const value = await call();
    revalidatePath("/", "layout");
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, fallbackMessage) };
  }
}

export async function createBoardItem(input: {
  workspaceId: string;
  kind: BoardItemKind;
  body: string;
}): Promise<BoardOutcome<BoardItem>> {
  return runAction(t.board.addFailed, () =>
    callApi<BoardItem>(toBoardPath(input.workspaceId), { method: "POST", body: { kind: input.kind, body: input.body } }),
  );
}

/** Decide or reject an idea; a reason is required and only people decide, never agents. */
export async function updateIdeaDecision(input: {
  workspaceId: string;
  number: number;
  decision: Decision;
  reason: string;
}): Promise<BoardOutcome<BoardItem>> {
  return runAction(t.board.decideFailed, () =>
    callApi<BoardItem>(`${toBoardPath(input.workspaceId)}/${input.number}/decision`, {
      method: "PUT",
      body: { decision: input.decision, reason: input.reason },
    }),
  );
}

export async function updateIdeaToDiscussing(workspaceId: string, number: number): Promise<BoardOutcome<BoardItem>> {
  return runAction(t.board.discussFailed, () =>
    callApi<BoardItem>(`${toBoardPath(workspaceId)}/${number}/status`, { method: "PUT", body: { status: "discussing" } }),
  );
}

/** Build the summary; owner only, the same as /brief in a channel. */
export async function createBrief(workspaceId: string): Promise<BoardOutcome<Brief>> {
  return runAction(t.brief.buildFailed, () =>
    callApi<Brief>(`/workspaces/${encodeURIComponent(workspaceId)}/brief`, { method: "POST" }),
  );
}
