"use client";
// Lists the files attached to a conversation above the composer, each with its size and a remove button.
import { FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { format, t } from "@/lib/i18n";
import type { ConversationDocument } from "@/types/conversation";

import { deleteDocument } from "../api/document-actions";
import { toFileSizeLabel } from "../utils/document-format";

export function DocumentChips({
  conversationId,
  documents,
  onError,
}: {
  conversationId: string;
  documents: ConversationDocument[];
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove(attachment: ConversationDocument) {
    startTransition(async () => {
      const outcome = await deleteDocument(conversationId, attachment.id);
      if (!outcome.ok) return onError(outcome.error);
      router.refresh();
    });
  }

  if (documents.length === 0) return null;
  return (
    <ul aria-label={t.personal.documentsLabel} className="flex flex-wrap gap-1.5 px-2 pt-2">
      {documents.map((attachment) => (
        <li
          key={attachment.id}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background py-1 pr-1 pl-2 text-xs"
        >
          <FileText className="size-3.5 shrink-0 text-subtle" aria-hidden />
          <span className="truncate text-foreground" title={attachment.fileName}>
            {attachment.fileName}
          </span>
          <span className="shrink-0 text-subtle">{toFileSizeLabel(attachment.sizeBytes)}</span>
          {attachment.truncated ? (
            <span className="shrink-0 text-subtle">
              {format(t.personal.documentTruncated, { sent: attachment.sentChars, total: attachment.charCount })}
            </span>
          ) : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleRemove(attachment)}
            aria-label={format(t.personal.removeDocument, { name: attachment.fileName })}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
