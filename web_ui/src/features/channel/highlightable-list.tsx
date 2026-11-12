// Vùng tin nhắn của kênh chung: tự cuộn xuống tin mới, và bôi đen một đoạn trong tin của người khác thì hiện nút
// Highlight. Đoạn được lưu vào ngữ cảnh agent riêng của người bôi đen, kèm tên người nói.
// Tin của chính mình và của agent mình đã tự vào ngữ cảnh, nên chỉ hiện lời nhắc thay cho nút.
"use client";

import { useRouter } from "next/navigation";
import { Highlighter, Info } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HighlightDialog, type HighlightDraft } from "@/features/highlight/highlight-dialog";

interface Tip {
  draft: HighlightDraft;
  own: boolean;
  top: number;
  left: number;
}

export function HighlightableList({
  workspaceId,
  watch,
  className,
  children,
}: {
  workspaceId: string;
  watch: unknown;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [draft, setDraft] = useState<HighlightDraft | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [watch]);

  function onSelectionEnd() {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    const box = ref.current;
    if (!sel || !text || sel.rangeCount === 0 || !box) return setTip(null);
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const msg = (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>("[data-message-id]");
    if (!msg || !box.contains(msg)) return setTip(null);
    const rect = range.getBoundingClientRect();
    const outer = box.getBoundingClientRect();
    setSaved(false);
    setTip({
      own: msg.dataset.own === "true",
      draft: {
        workspaceId,
        channelId: msg.dataset.channelId!,
        messageId: msg.dataset.messageId!,
        speaker: msg.dataset.speaker ?? "",
        text,
      },
      top: rect.top - outer.top + box.scrollTop - 40,
      left: Math.max(8, Math.min(rect.left - outer.left + rect.width / 2 - 64, outer.width - 280)),
    });
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={ref} onMouseUp={onSelectionEnd} onKeyUp={(e) => (e.shiftKey ? onSelectionEnd() : null)} className={className}>
        <div className="relative">
          {children}
          {tip ? (
            tip.own ? (
              <p
                role="status"
                style={{ top: tip.top, left: tip.left }}
                className="absolute z-10 inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-3 text-[13px] text-muted-foreground shadow-float"
              >
                <Info className="size-4 text-subtle" /> Tin của bạn đã tự vào ngữ cảnh agent của bạn
              </p>
            ) : (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setDraft(tip.draft);
                  setTip(null);
                }}
                style={{ top: tip.top, left: tip.left }}
                className="absolute z-10 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-float focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
              >
                <Highlighter className="size-4" /> Highlight cho agent của tôi
              </button>
            )
          ) : null}
        </div>
      </div>
      {saved ? (
        <p role="status" className="px-4 pb-1 text-[13px] text-muted-foreground">
          Đã lưu highlight. Agent ở workspace riêng của bạn sẽ đọc đoạn này ở lượt hỏi tiếp theo.
        </p>
      ) : null}
      <HighlightDialog
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={() => {
          setDraft(null);
          setSaved(true);
          window.getSelection()?.removeAllRanges();
          router.refresh();
        }}
      />
    </div>
  );
}
