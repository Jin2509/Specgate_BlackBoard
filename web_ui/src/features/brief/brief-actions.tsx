// Nút dựng lại, sao chép và tải Markdown của bản tổng hợp.
"use client";

import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BriefActions({ markdown, fileName = "ban-tong-hop.md" }: { markdown: string; fileName?: string }) {
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
      <Button variant="secondary" size="sm">
        <RefreshCw /> Dựng lại
      </Button>
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Đã chép" : "Sao chép"}
      </Button>
      <Button size="sm" onClick={download}>
        <Download /> Tải Markdown
      </Button>
    </>
  );
}
