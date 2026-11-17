"use server";
// Creates, renames, links, deletes and summarizes private conversations; asking and regenerating stream from the browser.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMe } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { Conversation, PrivateHighlight, Turn } from "@/types/conversation";
import { toPersonalHomePath } from "@/utils/route-paths";

import { runPersonalAction, type PersonalOutcome } from "./personal-action-runner";

export type HighlightDisposal = "keep" | "delete";

function toConversationPath(conversationId: string): string {
  return `/conversations/${encodeURIComponent(conversationId)}`;
}

/** Create a conversation, optionally with a shared workspace as team context before the first question. */
export async function createConversation(workspaceId?: string): Promise<PersonalOutcome<{ id: string }>> {
  return runPersonalAction(t.personal.conversationCreateFailed, async () => {
    const conversation = await callApi<Conversation>("/conversations", {
      method: "POST",
      body: { workspaceId: workspaceId || null },
    });
    return { id: conversation.id };
  });
}

/** Delete a conversation, keeping (default) or deleting its private highlights as the user chose. */
export async function deleteConversation(conversationId: string, highlights: HighlightDisposal): Promise<void> {
  const me = await requireMe();
  await callApi(toConversationPath(conversationId), { method: "DELETE", query: { highlights } }).catch(() => undefined);
  revalidatePath("/", "layout");
  redirect(toPersonalHomePath(me.personalWorkspaceId));
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<PersonalOutcome> {
  return runPersonalAction(t.personal.renameFailed, () =>
    callApi(toConversationPath(conversationId), { method: "PATCH", body: { title } }),
  );
}

/** Link the conversation to a shared workspace as team context, or unlink it when "None" is chosen. */
export async function updateConversationWorkspace(formData: FormData): Promise<void> {
  await requireMe();
  const conversationId = String(formData.get("conversationId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "") || null;
  await callApi(toConversationPath(conversationId), { method: "PATCH", body: { workspaceId } }).catch(() => undefined);
  revalidatePath("/", "layout");
}

/** Show one version of an answer ("‹ 1/2 ›"); the agent only reads the version on screen. */
export async function updateShownVersion(conversationId: string, turnId: string): Promise<PersonalOutcome<Conversation>> {
  return runPersonalAction(t.personal.versionFailed, () =>
    callApi<Conversation>(`${toConversationPath(conversationId)}/turns/${encodeURIComponent(turnId)}/show`, {
      method: "POST",
    }),
  );
}

/** Summarize the user's old channel messages; runs only on click, with one agent call on the user's key. */
export async function createOldMessagesDigest(
  conversationId: string,
): Promise<PersonalOutcome<{ done: { messages: number; blocks: number; summarizedBlocks: number } }>> {
  return runPersonalAction(t.personal.digestFailed, () =>
    callApi(`${toConversationPath(conversationId)}/context/digest`, { method: "POST" }),
  );
}

/** Have the agent write a fixed-format team summary, saved as a private highlight and not yet sent. */
export async function createConversationSummary(conversationId: string): Promise<PersonalOutcome<PrivateHighlight>> {
  return runPersonalAction(t.personal.summaryFailed, () =>
    callApi<PrivateHighlight>(`${toConversationPath(conversationId)}/summary`, { method: "POST" }),
  );
}

/** List the answered turns of a conversation, to pick which ones to attach to a summary. */
export async function listTurns(conversationId: string): Promise<PersonalOutcome<Turn[]>> {
  await requireMe();
  try {
    const conversation = await callApi<Conversation>(toConversationPath(conversationId));
    return { ok: true, value: conversation.turns.filter((turn) => !turn.error) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.personal.conversationOpenFailed) };
  }
}
