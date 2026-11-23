// Uploads a PDF or Word file to a channel from the browser; the server posts its text as a message.
import { toApiPath } from "@/lib/api/api-base-path";
import { toErrorText } from "@/lib/api/error-text";
import { toApiError } from "@/lib/api/http-client";
import { t } from "@/lib/i18n";

/** Return null when the text was posted, or the message to show. */
export async function uploadChannelDocument(workspaceId: string, channelId: string, file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", file);
  const path = `/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/documents`;
  try {
    const response = await fetch(toApiPath(path), { method: "POST", headers: { Accept: "application/json" }, body });
    if (response.ok) return null;
    const apiError = await toApiError(response);
    return toErrorText(apiError.code, apiError.message, t.documents.uploadFailed);
  } catch {
    return t.errors.backendUnreachable;
  }
}
