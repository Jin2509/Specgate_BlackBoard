"use client";
// Copies and downloads the Markdown of the summary, and lets the owner build it again from the idea board.
import { Check, Copy, Download, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { createBrief } from "@/features/board";
import { t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import { downloadTextFile } from "@/utils/download-text-file";

export function BriefActions({ markdown }: { markdown: string | null }) {
  const [isCopied, setIsCopied] = useState(false);

  function handleDownload() {
    if (markdown) downloadTextFile(t.brief.fileName, markdown, "text/markdown;charset=utf-8");
  }

  async function handleCopy() {
    if (!markdown) return;
    await navigator.clipboard?.writeText(markdown);
    setIsCopied(true);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!markdown}>
        {isCopied ? <Check /> : <Copy />}{" "}
        <span className="@max-2xl/header:sr-only">{isCopied ? t.brief.copied : t.brief.copy}</span>
      </Button>
      <Button size="sm" onClick={handleDownload} disabled={!markdown}>
        <Download /> <span className="@max-2xl/header:sr-only">{t.brief.download}</span>
      </Button>
    </>
  );
}

/** Owner only: build the summary again from the idea board as it is now. */
export function BriefRebuildButton({ workspaceId, hasBrief }: { workspaceId: string; hasBrief: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRebuild() {
    startTransition(async () => {
      const outcome = await createBrief(workspaceId);
      if (outcome.ok) router.refresh();
      else showErrorToast(outcome.error);
    });
  }

  return (
    <Button
      variant={hasBrief ? "secondary" : "default"}
      size="sm"
      onClick={handleRebuild}
      disabled={isPending}
      title={hasBrief ? t.brief.rebuildTitle : undefined}
    >
      {isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} {hasBrief ? t.brief.rebuild : t.brief.build}
    </Button>
  );
}
