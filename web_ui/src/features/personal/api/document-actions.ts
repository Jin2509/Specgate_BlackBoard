"use server";
// Reads the text of and removes files attached to a private conversation; uploading runs from the browser (document-upload.ts).
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { ConversationDocument } from "@/types/conversation";

import { runPersonalAction, type PersonalOutcome } from "./personal-action-runner";

function toDocumentPath(conversationId: string, documentId: string): string {
  return `/conversations/${encodeURIComponent(conversationId)}/documents/${encodeURIComponent(documentId)}`;
}

/** The Markdown read from an attached file. */
export async function getDocumentMarkdown(conversationId: string, documentId: string): Promise<PersonalOutcome<string>> {
  try {
    const document = await callApi<ConversationDocument & { markdown: string }>(toDocumentPath(conversationId, documentId));
    return { ok: true, value: document.markdown };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.documents.readFailed) };
  }
}

export async function deleteDocument(conversationId: string, documentId: string): Promise<PersonalOutcome> {
  return runPersonalAction(t.personal.documentRemoveFailed, () =>
    callApi(toDocumentPath(conversationId, documentId), { method: "DELETE" }),
  );
}
