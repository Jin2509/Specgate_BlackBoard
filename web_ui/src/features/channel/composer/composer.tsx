// Ô soạn tin của kênh chung: gợi ý @ (agent, người, highlight) và / (lệnh), đính kèm highlight, gửi tin.
"use client";

import { AtSign, Highlighter, LoaderCircle, SendHorizontal, SquareSlash, X } from "lucide-react";
import { useActionState, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { postMessage, type PostState } from "@/lib/channel-actions";
import { highlightLabelMeta } from "@/lib/status";
import type { Agent, Highlight, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SuggestionMenu } from "./suggestion-menu";
import { applySuggestion, commandSuggestions, mentionSuggestions, trailingTrigger, type Suggestion } from "./suggestions";

export function Composer({
  workspaceId,
  channelId,
  agents,
  people,
  highlights,
  modules,
  channelName,
}: {
  workspaceId: string;
  channelId: string;
  agents: Agent[];
  people: Profile[];
  highlights: Highlight[];
  modules: string[];
  channelName: string;
}) {
  const demoText = useQueryParam("composer");
  const demoMenus = useQueryParam("menus") === "both";
  const [text, setText] = useState<string | null>(null);
  const [attached, setAttached] = useState<Highlight[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<PostState, FormData>(postMessage, {});
  const value = text ?? demoText ?? "";
  const trigger = trailingTrigger(value);

  // Gửi xong thì xóa ô soạn và thẻ đính kèm (cập nhật ngay trong lúc render, không qua effect).
  const [handledSentAt, setHandledSentAt] = useState<number | undefined>(undefined);
  if (state.sentAt && state.sentAt !== handledSentAt) {
    setHandledSentAt(state.sentAt);
    setText("");
    setAttached([]);
  }

  const available = highlights.filter((h) => !attached.some((a) => a.id === h.id));
  const mentionItems = mentionSuggestions(agents, people, trigger?.mode === "@" ? trigger.query : "", available);
  const commandItems = commandSuggestions(modules, trigger?.mode === "/" ? trigger.query : "");
  const showMentions = demoMenus || trigger?.mode === "@";
  const showCommands = demoMenus || trigger?.mode === "/";
  const items = trigger?.mode === "/" ? commandItems : mentionItems;
  const canSend = Boolean(value.trim()) || attached.length > 0;

  function insert(s: Suggestion) {
    if (s.kind === "highlight") setAttached((prev) => [...prev, s.highlight]);
    setText(applySuggestion(value, s));
    setActive(0);
    inputRef.current?.focus();
  }

  function appendTrigger(ch: "@" | "/") {
    setText(value + (value && !value.endsWith(" ") ? ` ${ch}` : ch));
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (trigger && items.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insert(items[Math.min(active, items.length - 1)]);
        return;
      }
      if (e.key === "Escape") {
        setText(value + " ");
        return;
      }
    }
    if (e.key === "Backspace" && !value && attached.length > 0) setAttached((prev) => prev.slice(0, -1));
  }

  return (
    <form ref={formRef} action={action} className="relative px-4 pb-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="channelId" value={channelId} />
      {attached.map((h) => (
        <input key={h.id} type="hidden" name="highlightId" value={h.id} />
      ))}

      {showMentions && mentionItems.length > 0 ? (
        <SuggestionMenu
          className={cn("bottom-full left-4 mb-1", demoMenus ? "w-82.5" : "w-[min(30rem,calc(100%-2rem))]")}
          items={mentionItems}
          activeIndex={trigger?.mode === "@" ? active : 0}
          onPick={insert}
        />
      ) : null}
      {showCommands && commandItems.length > 0 ? (
        <SuggestionMenu
          className={cn("bottom-full mb-1", demoMenus ? "right-4 w-102.5" : "left-4 w-[min(28rem,calc(100%-2rem))]")}
          items={commandItems}
          activeIndex={trigger?.mode === "/" ? active : demoMenus ? 3 : 0}
          onPick={insert}
        />
      ) : null}

      <div className="rounded-lg border border-border bg-composer focus-within:border-primary/50">
        {attached.length > 0 ? (
          <ul aria-label="Highlight đính kèm" className="flex flex-col gap-1.5 px-3 pt-3">
            {attached.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-2 rounded-md border-l-[3px] border-mark-line bg-card py-1.5 pr-1.5 pl-2.5"
              >
                <p className="line-clamp-2 flex-1 text-[13.5px] leading-snug">
                  <span className="mr-1.5 text-xs font-medium text-primary-strong">{highlightLabelMeta[h.label].label}</span>
                  {h.text}
                </p>
                <button
                  type="button"
                  aria-label="Bỏ highlight này"
                  onClick={() => setAttached((prev) => prev.filter((x) => x.id !== h.id))}
                  className="rounded p-0.5 text-subtle hover:bg-hover hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-center gap-1 pr-2 pl-3">
          <input
            ref={inputRef}
            name="text"
            value={value}
            onChange={(e) => {
              setText(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={attached.length > 0 ? "Thêm lời nhắn (không bắt buộc)" : `Nhắn #${channelName}`}
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle"
            aria-label="Nội dung tin nhắn"
            autoComplete="off"
          />
          {highlights.length > 0 ? (
            <ComposerButton label="Đính kèm highlight" onClick={() => appendTrigger("@")}>
              <Highlighter className="size-5" />
            </ComposerButton>
          ) : null}
          <ComposerButton label="Gọi agent hoặc nhắc người" onClick={() => appendTrigger("@")}>
            <AtSign className="size-5" />
          </ComposerButton>
          <ComposerButton label="Dùng lệnh" onClick={() => appendTrigger("/")}>
            <SquareSlash className="size-5" />
          </ComposerButton>
          <ComposerButton
            label="Gửi"
            type="submit"
            disabled={!canSend || pending}
            className={canSend ? "text-primary" : "opacity-40"}
          >
            {pending ? <LoaderCircle className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </ComposerButton>
        </div>
      </div>
      <p className="mt-1 px-1 text-[11.5px] text-subtle" role={state.error ? "alert" : undefined}>
        {state.error ?? "Enter để gửi. Agent chỉ trả lời khi được gọi tên."}
      </p>
    </form>
  );
}

function ComposerButton({
  label,
  onClick,
  type = "button",
  disabled,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default",
        className,
      )}
    >
      {children}
    </button>
  );
}
