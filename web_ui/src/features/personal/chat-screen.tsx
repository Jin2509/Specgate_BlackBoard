// Trang chat của workspace riêng: các lượt hỏi đáp với agent, ô hỏi ở đáy.
// Hội thoại gắn workspace chung thì mỗi câu trả lời (hoặc đoạn bôi đen trong đó) gửi được vào kênh dưới tên agent của bạn.
// Không dùng bong bóng chat: mỗi lượt là một dòng ghi chép có cột tên bên trái, đọc như vở ghi.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Send, SendHorizontal } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { askAgent, type TurnFormState } from "@/lib/private-actions";
import type { Channel, Turn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NewChatContextSelect, type WorkspaceOption } from "./context-picker";
import { SendToChannelDialog, type SendDraft } from "./send-to-channel-dialog";
import { TurnText } from "./turn-text";

export interface ChatLink {
  workspaceId: string;
  workspaceName: string;
  channels: Channel[];
}

interface SelectionTip {
  turnId: string;
  text: string;
  top: number;
  left: number;
}

export function ChatScreen({
  conversationId,
  turns,
  model,
  link,
  linkOptions = [],
}: {
  conversationId?: string;
  turns: Turn[];
  model: string;
  /** Workspace chung đã gắn với hội thoại này. */
  link?: ChatLink;
  /** Hội thoại mới: các workspace chung để chọn ngữ cảnh trước câu hỏi đầu. */
  linkOptions?: WorkspaceOption[];
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState<TurnFormState, FormData>(askAgent, {});
  const [question, setQuestion] = useState("");
  const [lastAsked, setAsked] = useState<string | null>(null);
  // Câu vừa hỏi chỉ hiện tạm trong lúc chờ trả lời; xong thì lượt thật từ máy chủ thay vào.
  const asked = pending ? lastAsked : null;
  const [tip, setTip] = useState<SelectionTip | null>(null);
  const [draft, setDraft] = useState<SendDraft | null>(null);
  const [sentTo, setSentTo] = useState<Channel | null>(null);
  const [newLink, setNewLink] = useState("");
  const canSend = Boolean(conversationId && link);
  const typing = useTyping(turns);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length, pending, typing.shown]);

  function onSubmit(form: FormData) {
    const text = String(form.get("text") ?? "").trim();
    if (!text) return;
    setAsked(text);
    setQuestion("");
    action(form);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  // Bôi đen trong một câu trả lời thì hiện nút "Gửi đoạn này vào kênh" ngay trên đoạn chọn.
  function onSelectionEnd() {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!sel || !text || sel.rangeCount === 0 || !canSend) return setTip(null);
    const range = sel.getRangeAt(0);
    const turnEl = (
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
    )?.closest<HTMLElement>("[data-turn-id]");
    const box = scrollRef.current;
    if (!turnEl || !box || turnEl.dataset.role !== "assistant") return setTip(null);
    const rect = range.getBoundingClientRect();
    const outer = box.getBoundingClientRect();
    setTip({
      turnId: turnEl.dataset.turnId!,
      text,
      top: rect.top - outer.top + box.scrollTop - 40,
      left: Math.max(8, Math.min(rect.left - outer.left + rect.width / 2 - 88, outer.width - 200)),
    });
  }

  function openDraft(turnId: string, text: string) {
    const turn = turns.find((t) => t.id === turnId);
    if (!conversationId || !turn) return;
    setTip(null);
    setSentTo(null);
    setDraft({ conversationId, turnId, text, model: turn.model ?? model });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onMouseUp={onSelectionEnd}
        onKeyUp={(e) => (e.shiftKey ? onSelectionEnd() : null)}
        className="relative flex-1 scrollbar-thin overflow-y-auto"
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 pt-8 pb-6 sm:px-8">
          {turns.length === 0 && !asked ? <EmptyState model={model} /> : null}
          <ol className="space-y-7">
            {turns.map((t) => (
              <TurnRow
                key={t.id}
                turn={t}
                text={typing.id === t.id ? t.text.slice(0, typing.shown) : t.text}
                typing={typing.id === t.id && typing.shown < t.text.length}
                onSend={canSend && t.role === "assistant" ? () => openDraft(t.id, t.text) : undefined}
              />
            ))}
            {asked ? (
              <>
                <TurnRow turn={{ id: "pending-q", role: "user", text: asked, at: "" }} text={asked} />
                <li className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4 max-sm:grid-cols-1 max-sm:gap-1">
                  <span className="truncate pt-0.5 font-mono text-xs text-agent">{model}</span>
                  <span className="text-[15px] text-subtle">
                    Đang trả lời
                    <span className="stream-caret" aria-hidden />
                  </span>
                </li>
              </>
            ) : null}
          </ol>
        </div>

        {tip ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openDraft(tip.turnId, tip.text)}
            style={{ top: tip.top, left: tip.left }}
            className="absolute z-10 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-float focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
          >
            <Send className="size-4" /> Gửi đoạn này vào kênh
          </button>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-3 sm:px-8">
        {sentTo && link ? (
          <p role="status" className="mb-2 text-[13px] text-muted-foreground">
            Đã gửi vào #{sentTo.name}.{" "}
            <Link
              href={`/w/${link.workspaceId}/c/${sentTo.id}`}
              className="text-primary-strong underline-offset-2 hover:underline"
            >
              Mở kênh
            </Link>
          </p>
        ) : null}
        <form action={onSubmit} className="rounded-lg border border-border bg-composer focus-within:border-subtle">
          {conversationId ? <input type="hidden" name="conversationId" value={conversationId} /> : null}
          {!conversationId && newLink ? <input type="hidden" name="workspaceId" value={newLink} /> : null}
          <label htmlFor="ask" className="sr-only">
            Câu hỏi cho agent
          </label>
          <textarea
            id="ask"
            name="text"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Hỏi ${model}`}
            className="block max-h-48 min-h-14 w-full resize-none bg-transparent px-3 pt-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-subtle"
          />
          <div className="flex items-center gap-2 px-2 pb-2">
            {!conversationId && linkOptions.length > 0 ? (
              <NewChatContextSelect value={newLink} onChange={setNewLink} options={linkOptions} />
            ) : null}
            <p className="flex-1 truncate px-1 text-xs text-subtle">
              {canSend
                ? `Enter để gửi. Agent đọc ngữ cảnh của ${link?.workspaceName}; bôi đen câu trả lời để gửi vào kênh.`
                : "Enter để gửi, Shift+Enter xuống dòng."}
            </p>
            <button
              type="submit"
              aria-label="Gửi câu hỏi"
              disabled={pending || !question.trim()}
              className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-composer focus-visible:outline-none disabled:opacity-35"
            >
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            </button>
          </div>
        </form>
        {state.error ? (
          <p role="alert" className="mt-1.5 text-[13px] text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>

      {link ? (
        <SendToChannelDialog
          draft={draft}
          workspaceName={link.workspaceName}
          channels={link.channels}
          onClose={() => setDraft(null)}
          onSent={(channel) => {
            setDraft(null);
            setSentTo(channel);
            window.getSelection()?.removeAllRanges();
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function TurnRow({ turn, text, typing = false, onSend }: { turn: Turn; text: string; typing?: boolean; onSend?: () => void }) {
  const mine = turn.role === "user";
  return (
    <li
      data-turn-id={turn.id}
      data-role={turn.role}
      className="group grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4 max-sm:grid-cols-1 max-sm:gap-1"
    >
      <div className="pt-0.5 leading-tight">
        <span className={cn("block truncate text-xs", mine ? "font-semibold text-muted-foreground" : "font-mono text-agent")}>
          {mine ? "Bạn" : turn.model}
        </span>
        {turn.at ? <time className="text-[11px] text-subtle">{turn.at}</time> : null}
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "text-[15px] leading-relaxed",
            mine ? "border-l-2 border-border pl-3 text-muted-foreground" : "text-foreground",
          )}
        >
          <TurnText text={text} />
          {typing ? <span className="stream-caret" aria-hidden /> : null}
        </div>
        {onSend && !typing ? (
          <button
            type="button"
            onClick={onSend}
            className="mt-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-subtle opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-hover hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none max-sm:opacity-100"
          >
            <Send className="size-3.5" /> Gửi vào kênh
          </button>
        ) : null}
      </div>
    </li>
  );
}

function EmptyState({ model }: { model: string }) {
  return (
    <div className="mt-auto mb-8 max-w-lg">
      <h2 className="text-xl font-semibold text-sidebar-accent-foreground">Hỏi gì cũng được, chỉ mình bạn thấy</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        Bạn đang chat với <span className="font-mono text-[13.5px] text-agent">{model}</span> bằng key của mình. Chọn một
        workspace chung làm ngữ cảnh thì agent biết trong nhóm có ai, làm gì, đã chốt gì, và đọc các đoạn bạn highlight trong
        kênh. Câu trả lời gửi thẳng vào kênh được, không cần copy.
      </p>
    </div>
  );
}

// Lượt trả lời vừa đến hiện dần từng chữ (giả lập stream). Lượt đã có từ trước hiện ngay.
function useTyping(turns: Turn[]) {
  const known = useRef<Set<string> | null>(null);
  const [state, setState] = useState<{ id: string | null; shown: number }>({ id: null, shown: 0 });

  useEffect(() => {
    if (known.current === null) {
      known.current = new Set(turns.map((t) => t.id));
      return;
    }
    const last = turns.at(-1);
    const fresh = turns.filter((t) => !known.current!.has(t.id));
    fresh.forEach((t) => known.current!.add(t.id));
    if (!last || last.role !== "assistant" || !fresh.some((t) => t.id === last.id)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const total = last.text.length;
    const duration = Math.min(1800, total * 14);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const shown = Math.min(total, Math.ceil(((now - start) / duration) * total));
      setState({ id: last.id, shown });
      if (shown < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [turns]);

  return state;
}
