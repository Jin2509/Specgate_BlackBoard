"use client";
// Copies a text to the clipboard and confirms it briefly.
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { t } from "@/lib/i18n";

const CONFIRMATION_MS = 1500;
const DEFAULT_CLASS_NAME =
  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function CopyButton({ text, label = t.common.copy, className }: { text: string; label?: string; className?: string }) {
  const [isCopied, setIsCopied] = useState(false);

  function handleClick() {
    void navigator.clipboard?.writeText(text).then(() => {
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), CONFIRMATION_MS);
    });
  }

  return (
    <button type="button" onClick={handleClick} className={className ?? DEFAULT_CLASS_NAME}>
      {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {isCopied ? t.common.copied : label}
    </button>
  );
}
