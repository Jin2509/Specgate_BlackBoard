"use server";
// Saves, edits, deletes, cleans up and sends private highlights; a send posts one message with a quote card per item.
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { HighlightColor, PrivateHighlight } from "@/types/conversation";
import type { Message } from "@/types/message";

import { runPersonalAction, type PersonalOutcome } from "./personal-action-runner";

const PRIVATE_HIGHLIGHTS_PATH = "/private-highlights";

function toPrivateHighlightPath(highlightId: string): string {
  return `${PRIVATE_HIGHLIGHTS_PATH}/${encodeURIComponent(highlightId)}`;
}

export async function createPrivateHighlight(input: {
  conversationId: string;
  turnId: string;
  text: string;
  color: HighlightColor;
  note?: string;
}): Promise<PersonalOutcome<PrivateHighlight>> {
  return runPersonalAction(t.personal.highlightSaveFailed, () =>
    callApi<PrivateHighlight>(PRIVATE_HIGHLIGHTS_PATH, { method: "POST", body: input }),
  );
}

export async function updatePrivateHighlight(
  highlightId: string,
  patch: { text?: string; color?: HighlightColor; note?: string | null; attachedTurnIds?: string[] },
): Promise<PersonalOutcome<PrivateHighlight>> {
  return runPersonalAction(t.personal.changeSaveFailed, () =>
    callApi<PrivateHighlight>(toPrivateHighlightPath(highlightId), { method: "PATCH", body: patch }),
  );
}

export async function deletePrivateHighlight(highlightId: string): Promise<PersonalOutcome> {
  return runPersonalAction(t.personal.highlightDeleteFailed, () =>
    callApi(toPrivateHighlightPath(highlightId), { method: "DELETE" }),
  );
}

export async function deletePrivateHighlights(filter: {
  ids?: string[];
  color?: HighlightColor;
  conversationId?: string;
  sentOnly?: boolean;
}): Promise<PersonalOutcome<{ deleted: number; total: number }>> {
  return runPersonalAction(t.personal.cleanupFailed, () =>
    callApi<{ deleted: number; total: number }>(`${PRIVATE_HIGHLIGHTS_PATH}/cleanup`, { method: "POST", body: filter }),
  );
}

/**
 * Send highlights to a channel under the user's name. The code ALREADY_SENT asks before a repeat send, and
 * OTHER_CONTEXT asks before sending a passage written while the agent read another team.
 */
export async function createHighlightSend(input: {
  ids: string[];
  workspaceId: string;
  channelId: string;
  text?: string;
  overrides?: Record<string, string>;
  confirm?: boolean;
  confirmContext?: boolean;
}): Promise<PersonalOutcome<Message>> {
  return runPersonalAction(t.personal.sendFailed, () =>
    callApi<Message>(`${PRIVATE_HIGHLIGHTS_PATH}/send`, { method: "POST", body: input }),
  );
}

/** Save "my old messages digest" as a private highlight, the only way to share it. */
export async function createDigestHighlight(workspaceId: string): Promise<PersonalOutcome<PrivateHighlight>> {
  return runPersonalAction(t.personal.digestSaveFailed, () =>
    callApi<PrivateHighlight>(`${PRIVATE_HIGHLIGHTS_PATH}/from-digest`, { method: "POST", body: { workspaceId } }),
  );
}
