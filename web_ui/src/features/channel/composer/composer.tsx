// Ô soạn tin nhắn có gợi ý @ agent và / lệnh.
"use client";

import { AtSign, Plus, SendHorizontal, SquareSlash } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import type { Agent, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SuggestionMenu } from "./suggestion-menu";
import { applySuggestion, commandSuggestions, mentionSuggestions, trailingTrigger, type Suggestion } from "./suggestions";

export function Composer({
  agents,
  people,
  modules,
  channelName,
}: {
  agents: Agent[];
  people: Profile[];
  modules: string[];
  channelName: string;
}) {
  const demoText = useQueryParam("composer");
  const demoMenus = useQueryParam("menus") === "both";
  const [text, setText] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const value = text ?? demoText ?? "";
  const trigger = trailingTrigger(value);

  const mentionItems = mentionSuggestions(agents, people, trigger?.mode === "@" ? trigger.query : "");
  const commandItems = commandSuggestions(modules, trigger?.mode === "/" ? trigger.query : "");
  const showMentions = demoMenus || trigger?.mode === "@";
  const showCommands = demoMenus || trigger?.mode === "/";
  const items = trigger?.mode === "/" ? commandItems : mentionItems;

  function insert(s: Suggestion) {
    setText(applySuggestion(value, s));
    setActive(0);
    inputRef.current?.focus();
  }

  function appendTrigger(ch: "@" | "/") {
    setText(value + (value && !value.endsWith(" ") ? ` ${ch}` : ch));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!trigger || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(items[Math.min(active, items.length - 1)]);
    } else if (e.key === "Escape") {
      setText(value + " ");
    }
  }

  return (
    <div className="relative px-4 pb-2">
      {showMentions && mentionItems.length > 0 ? (
        <SuggestionMenu
          className={cn("bottom-full left-4 mb-1", demoMenus ? "w-82.5" : "w-95")}
          items={mentionItems}
          activeIndex={trigger?.mode === "@" ? active : 0}
          onPick={insert}
        />
      ) : null}
      {showCommands && commandItems.length > 0 ? (
        <SuggestionMenu
          className={cn("bottom-full mb-1", demoMenus ? "right-4 w-102.5" : "left-4 w-110")}
          items={commandItems}
          activeIndex={trigger?.mode === "/" ? active : demoMenus ? 3 : 0}
          onPick={insert}
        />
      ) : null}

      <div className="flex items-center gap-1 rounded-lg bg-composer pr-2 pl-1">
        <ComposerButton
          label="Đính kèm"
          className="mx-1 size-6 rounded-full bg-subtle text-composer hover:bg-sidebar-accent-foreground hover:text-composer"
        >
          <Plus className="size-4 stroke-3" />
        </ComposerButton>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={`Nhắn #${channelName}`}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle"
          aria-label="Nội dung tin nhắn"
        />
        <ComposerButton label="Gọi agent" onClick={() => appendTrigger("@")}>
          <AtSign className="size-5" />
        </ComposerButton>
        <ComposerButton label="Dùng lệnh" onClick={() => appendTrigger("/")}>
          <SquareSlash className="size-5" />
        </ComposerButton>
        {value.trim() ? (
          <ComposerButton label="Gửi" className="text-primary-strong">
            <SendHorizontal className="size-5" />
          </ComposerButton>
        ) : null}
      </div>
      <p className="mt-1 px-1 text-[11px] text-subtle">
        <kbd className="font-sans font-semibold">Enter</kbd> để gửi · <kbd className="font-sans font-semibold">↑↓</kbd> chọn gợi ý
        · agent chỉ trả lời khi được gọi tên
      </p>
    </div>
  );
}

function ComposerButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:text-sidebar-accent-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
