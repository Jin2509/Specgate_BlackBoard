"use server";
// Removes a file attached to a private conversation; uploading runs from the browser (document-upload.ts).
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";

import { runPersonalAction, type PersonalOutcome } from "./personal-action-runner";

export async function deleteDocument(conversationId: string, documentId: string): Promise<PersonalOutcome> {
  return runPersonalAction(t.personal.documentRemoveFailed, () =>
    callApi(`/conversations/${encodeURIComponent(conversationId)}/documents/${encodeURIComponent(documentId)}`, {
      method: "DELETE",
    }),
  );
}
