"use client";
// Shows the text read from an uploaded file as Markdown, with copy and download as a .md file.
import { Download, LoaderCircle } from "lucide-react";

import { CopyButton } from "@/components/CopyButton";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { format, t } from "@/lib/i18n";
import { downloadTextFile } from "@/utils/download-text-file";

const MARKDOWN_MEDIA_TYPE = "text/markdown;charset=utf-8";
const ORIGINAL_EXTENSION = /\.(pdf|docx)$/i;

function toMarkdownFileName(fileName: string): string {
  return `${fileName.replace(ORIGINAL_EXTENSION, "") || "document"}.md`;
}

function downloadMarkdown(fileName: string, markdown: string): void {
  downloadTextFile(toMarkdownFileName(fileName), markdown, MARKDOWN_MEDIA_TYPE);
}

export function DocumentViewerDialog({
  isOpen,
  onOpenChange,
  fileName,
  markdown,
  charCount,
  isTruncated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  fileName: string;
  /** Null while the text is still loading. */
  markdown: string | null;
  charCount: number;
  isTruncated: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <DialogDescription>
            {isTruncated && markdown !== null
              ? format(t.documents.viewerTruncated, { kept: markdown.length, total: charCount })
              : format(t.documents.viewerDescription, { count: charCount })}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-background px-4 py-3 text-sm">
          {markdown === null ? (
            <p className="flex items-center gap-2 text-subtle">
              <LoaderCircle className="size-4 animate-spin" /> {t.common.loading}
            </p>
          ) : (
            <Markdown text={markdown} />
          )}
        </div>
        <DialogFooter className="items-center">
          {markdown !== null ? (
            <>
              <CopyButton text={markdown} label={t.documents.copyMarkdown} />
              <Button variant="secondary" size="sm" onClick={() => downloadMarkdown(fileName, markdown)}>
                <Download /> {t.documents.downloadMarkdown}
              </Button>
            </>
          ) : null}
          <Button size="sm" onClick={() => onOpenChange(false)}>
            {t.common.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
