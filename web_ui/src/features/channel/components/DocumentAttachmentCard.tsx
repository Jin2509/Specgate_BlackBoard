"use client";
// Shows a file posted to the channel as its read text: a short preview and the full Markdown on demand.
import { FileText } from "lucide-react";
import { useState } from "react";

import { DocumentViewerDialog } from "@/components/DocumentViewerDialog";
import { format, t } from "@/lib/i18n";
import { toFileSizeLabel } from "@/utils/file-size";

const PREVIEW_CHARS_MAX = 280;

function toPreview(markdown: string): string {
  const flat = markdown
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > PREVIEW_CHARS_MAX ? `${flat.slice(0, PREVIEW_CHARS_MAX).trimEnd()}…` : flat;
}

export function DocumentAttachmentCard({
  fileName,
  sizeBytes,
  charCount,
  markdown,
  isTruncated,
}: {
  fileName: string;
  sizeBytes: number;
  charCount: number;
  markdown: string;
  isTruncated: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-1.5 max-w-xl rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-[0.8125rem]">
        <FileText className="size-4 shrink-0 text-primary-strong" aria-hidden />
        <span className="min-w-0 truncate font-medium text-foreground" title={fileName}>
          {fileName}
        </span>
        <span className="shrink-0 text-subtle">
          {toFileSizeLabel(sizeBytes)} · {format(t.documents.charCount, { count: charCount.toLocaleString() })}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted-foreground">{toPreview(markdown)}</p>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1.5 text-[0.8125rem] font-medium text-primary-strong hover:underline"
      >
        {t.documents.openText}
      </button>
      <DocumentViewerDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        fileName={fileName}
        markdown={markdown}
        charCount={charCount}
        isTruncated={isTruncated}
      />
    </div>
  );
}
