"use client";
// Lists the files attached to a conversation above the composer; each opens the text read from it or can be removed.
import { FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DocumentViewerDialog } from "@/components/DocumentViewerDialog";
import { format, t } from "@/lib/i18n";
import type { ConversationDocument } from "@/types/conversation";
import { toFileSizeLabel } from "@/utils/file-size";

import { deleteDocument, getDocumentMarkdown } from "../api/document-actions";

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
  const [openDocument, setOpenDocument] = useState<ConversationDocument | null>(null);
  const [openMarkdown, setOpenMarkdown] = useState<string | null>(null);

  async function handleOpen(attachment: ConversationDocument) {
    setOpenDocument(attachment);
    setOpenMarkdown(null);
    const outcome = await getDocumentMarkdown(conversationId, attachment.id);
    if (!outcome.ok) {
      setOpenDocument(null);
      return onError(outcome.error);
    }
    setOpenMarkdown(outcome.value);
  }

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
          <button
            type="button"
            onClick={() => void handleOpen(attachment)}
            title={t.documents.openText}
            className="truncate text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {attachment.fileName}
          </button>
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
      {openDocument ? (
        <DocumentViewerDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpenDocument(null);
          }}
          fileName={openDocument.fileName}
          markdown={openMarkdown}
          charCount={openDocument.charCount}
          isTruncated={openDocument.truncated}
        />
      ) : null}
    </ul>
  );
}
