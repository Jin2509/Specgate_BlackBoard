// Nút dựng lại (chỉ chủ workspace), sao chép và tải Markdown của bản tổng hợp.
"use client";

import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BriefActions({
  markdown,
  canRebuild,
  fileName = "ban-tong-hop.md",
}: {
  markdown: string;
  canRebuild: boolean;
  fileName?: string;
}) {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy() {
    await navigator.clipboard?.writeText(markdown);
    setCopied(true);
  }

  return (
    <>
      {canRebuild ? (
        <Button variant="secondary" size="sm">
          <RefreshCw /> <span className="max-sm:sr-only">Dựng lại</span>
        </Button>
      ) : (
        <span className="mr-1 text-xs text-subtle max-sm:hidden">Chủ workspace dựng bản này</span>
      )}
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />} <span className="max-sm:sr-only">{copied ? "Đã chép" : "Sao chép"}</span>
      </Button>
      <Button size="sm" onClick={download}>
        <Download /> <span className="max-sm:sr-only">Tải Markdown</span>
      </Button>
    </>
  );
}
