// Uploads a PDF or Word file to a conversation from the browser, so large files skip the server action body limit.
import { toApiPath } from "@/lib/api/api-base-path";
import { toErrorText } from "@/lib/api/error-text";
import { toApiError } from "@/lib/api/http-client";
import { t } from "@/lib/i18n";

/** Return null when the file was kept, or the message to show. */
export async function uploadDocument(conversationId: string, file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch(toApiPath(`/conversations/${encodeURIComponent(conversationId)}/documents`), {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
    if (response.ok) return null;
    const apiError = await toApiError(response);
    return toErrorText(apiError.code, apiError.message, t.personal.documentUploadFailed);
  } catch {
    return t.errors.backendUnreachable;
  }
}
