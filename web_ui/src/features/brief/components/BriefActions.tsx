"use client";
// Rebuilds (owner only), copies and downloads the Markdown of the summary.
import { Check, Copy, Download, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { createBrief } from "@/features/board";
import { t } from "@/lib/i18n";

export function BriefActions({
  workspaceId,
  markdown,
  canRebuild,
}: {
  workspaceId: string;
  markdown: string | null;
  canRebuild: boolean;
}) {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = t.brief.fileName;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  async function handleCopy() {
    if (!markdown) return;
    await navigator.clipboard?.writeText(markdown);
    setIsCopied(true);
  }

  function handleRebuild() {
    startTransition(async () => {
      const outcome = await createBrief(workspaceId);
      if (outcome.ok) router.refresh();
      else setError(outcome.error);
    });
  }

  return (
    <>
      {error ? (
        <span role="alert" className="mr-2 text-xs text-destructive">
          {error}
        </span>
      ) : null}
      {canRebuild ? (
        <Button variant="secondary" size="sm" onClick={handleRebuild} disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}{" "}
          <span className="@max-2xl/header:sr-only">{markdown ? t.brief.rebuild : t.brief.build}</span>
        </Button>
      ) : (
        <span className="mr-1 text-xs text-subtle max-sm:hidden">{t.brief.ownerBuilds}</span>
      )}
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
