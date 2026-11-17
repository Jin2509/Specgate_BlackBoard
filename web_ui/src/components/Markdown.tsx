"use client";
// Renders agent text as Markdown (headings, lists, tables, code) with a copy button on each code block.
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { t } from "@/lib/i18n";

import { CopyButton } from "./CopyButton";

function toPlainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toPlainText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return toPlainText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function toLanguage(children: ReactNode): string | undefined {
  const className = (children as { props?: { className?: string } } | undefined)?.props?.className ?? "";
  return /language-(\w+)/.exec(className)?.[1];
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return (
              <div className="overflow-hidden rounded-md border border-border">
                <div className="flex items-center justify-between bg-hover px-3 py-1 text-[11.5px] text-subtle select-none">
                  <span className="font-mono">{toLanguage(children) ?? t.common.code}</span>
                  <CopyButton text={toPlainText(children).replace(/\n$/, "")} label={t.common.copyCode} />
                </div>
                <pre>{children}</pre>
              </div>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
