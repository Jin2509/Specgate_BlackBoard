"use client";
// Composes a channel message with @ and / suggestions, attached private highlights and a draft kept across reloads.
import { AtSign, Highlighter, LoaderCircle, SendHorizontal, SquareSlash, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { useDraft } from "@/hooks/use-draft";
import { useOnline } from "@/hooks/use-online";
import { useQueryParam } from "@/hooks/use-query-param";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { PrivateHighlight } from "@/types/conversation";
import type { Profile } from "@/types/profile";
import { cn } from "@/utils/cn";
import { isImeComposing } from "@/utils/ime-composition";

import { ChannelDocumentButton } from "./ChannelDocumentButton";
import { HighlightPicker } from "./HighlightPicker";
import { SuggestionMenu } from "./SuggestionMenu";
import { createMessage, type MessageFormState } from "../api/channel-actions";
import {
  listCommandSuggestions,
  listMentionSuggestionsWithHighlights,
  toTextWithSuggestion,
  toTrailingTrigger,
  type Suggestion,
} from "../utils/suggestions";

const ALREADY_SENT_CODE = "ALREADY_SENT";

/** Index of /decide in the demo menu, so the prototype screenshot shows a highlighted command. */
const DEMO_ACTIVE_COMMAND_INDEX = 3;

function toQuoteHeading(highlight: PrivateHighlight, myName: string): string {
  if (highlight.kind === "summary") return format(t.channel.quoteSummary, { name: myName });
  const speaker =
    highlight.speakerKind === "agent"
      ? format(t.channel.agentOf, { agent: highlight.speaker.split(t.channel.ownerSeparator)[0], name: myName })
      : myName;
  const edited = highlight.edited ? format(t.channel.editedSuffix, { name: myName }) : "";
  return `${format(t.channel.says, { speaker })}${edited}`;
}

export function Composer({
  workspaceId,
  channelId,
  people,
  channelName,
  highlights,
  myName,
}: {
  workspaceId: string;
  channelId: string;
  people: Profile[];
  channelName: string;
  highlights: PrivateHighlight[];
  myName: string;
}) {
  const demoText = useQueryParam("composer");
  const isDemoMenus = useQueryParam("menus") === "both";
  const isOnline = useOnline();
  const [draft, setDraft] = useDraft(`channel:${workspaceId}:${channelId}`);
  const [text, setText] = useState<string | null>(null);
  const [quoteIds, setQuoteIds] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState<MessageFormState, FormData>(createMessage, {});
  useEffect(() => {
    if (state.error && state.code !== ALREADY_SENT_CODE) showErrorToast(state.error);
  }, [state]);
  const value = text ?? (draft || demoText || "");
  const trigger = toTrailingTrigger(value);

  function updateValue(next: string) {
    setText(next);
    setDraft(next);
  }

  // Clearing during render, not in an effect, avoids one frame showing the sent text.
  const [handledSentAt, setHandledSentAt] = useState<number | undefined>(undefined);
  if (state.sentAt && state.sentAt !== handledSentAt) {
    setHandledSentAt(state.sentAt);
    updateValue("");
    setQuoteIds([]);
  }

  const mentionItems = listMentionSuggestionsWithHighlights(people, trigger?.mode === "@" ? trigger.query : "");
  const commandItems = listCommandSuggestions(trigger?.mode === "/" ? trigger.query : "");
  const isMentionMenuShown = isDemoMenus || trigger?.mode === "@";
  const isCommandMenuShown = isDemoMenus || trigger?.mode === "/";
  const items = trigger?.mode === "/" ? commandItems : mentionItems;
  const canSend = (Boolean(value.trim()) || quoteIds.length > 0) && isOnline;
  const chosenHighlights = quoteIds
    .map((id) => highlights.find((highlight) => highlight.id === id))
    .filter((highlight): highlight is PrivateHighlight => Boolean(highlight));

  function insertSuggestion(suggestion: Suggestion) {
    updateValue(toTextWithSuggestion(value, suggestion));
    setActiveIndex(0);
    if (suggestion.kind === "highlights") setIsPickerOpen(true);
    else inputRef.current?.focus();
  }

  function appendTrigger(character: "@" | "/") {
    updateValue(value + (value && !value.endsWith(" ") ? ` ${character}` : character));
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!trigger || items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      // While Telex or VNI is composing, Enter confirms the word; it must not pick a suggestion.
      if (isImeComposing(event.nativeEvent)) return;
      event.preventDefault();
      insertSuggestion(items[Math.min(activeIndex, items.length - 1)]);
    } else if (event.key === "Escape") {
      updateValue(`${value} `);
    }
  }

  return (
    <form action={formAction} className="relative px-4 pb-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="channelId" value={channelId} />
      {quoteIds.map((id) => (
        <input key={id} type="hidden" name="quoteId" value={id} />
      ))}

      {isPickerOpen ? (
        <HighlightPicker
          highlights={highlights}
          chosenIds={quoteIds}
          channelId={channelId}
          onPick={(id) => {
            setQuoteIds((current) => (current.includes(id) ? current : [...current, id]));
            setIsPickerOpen(false);
            inputRef.current?.focus();
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      ) : null}
      {!isPickerOpen && isMentionMenuShown && mentionItems.length > 0 ? (
        <SuggestionMenu
          className={cn("bottom-full left-4 mb-1", isDemoMenus ? "w-82.5" : "w-[min(30rem,calc(100%-2rem))]")}
          items={mentionItems}
          activeIndex={trigger?.mode === "@" ? activeIndex : 0}
          onPick={insertSuggestion}
        />
      ) : null}
      {!isPickerOpen && isCommandMenuShown && commandItems.length > 0 ? (
        <SuggestionMenu
          className={cn("bottom-full mb-1", isDemoMenus ? "right-4 w-102.5" : "left-4 w-[min(28rem,calc(100%-2rem))]")}
          items={commandItems}
          activeIndex={trigger?.mode === "/" ? activeIndex : isDemoMenus ? DEMO_ACTIVE_COMMAND_INDEX : 0}
          onPick={insertSuggestion}
        />
      ) : null}

      <div className="rounded-lg border border-border bg-composer focus-within:border-primary/50">
        {chosenHighlights.length ? (
          <ul className="space-y-1.5 border-b border-border px-3 pt-2.5 pb-2">
            {chosenHighlights.map((highlight) => (
              <li
                key={highlight.id}
                className="flex items-start gap-2 rounded-md border-l-[3px] border-agent-line bg-muted px-2 py-1.5"
              >
                <div className="min-w-0 flex-1 text-[0.8125rem]">
                  <p className="text-xs font-medium text-agent">{toQuoteHeading(highlight, myName)}</p>
                  <p className="line-clamp-2 text-muted-foreground">{highlight.text}</p>
                </div>
                <button
                  type="button"
                  aria-label={t.channel.removeQuote}
                  onClick={() => setQuoteIds((current) => current.filter((id) => id !== highlight.id))}
                  className="rounded p-0.5 text-subtle hover:bg-hover hover:text-foreground"
                >
                  <X className="size-3.5" />
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
            onChange={(event) => {
              updateValue(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              quoteIds.length ? t.channel.placeholderWithQuotes : format(t.channel.placeholder, { channel: channelName })
            }
            className="h-11 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-subtle"
            aria-label={t.channel.messageLabel}
            autoComplete="off"
          />
          <ChannelDocumentButton workspaceId={workspaceId} channelId={channelId} />
          <ComposerButton label={t.channel.insertHighlight} onClick={() => setIsPickerOpen((isOpen) => !isOpen)}>
            <Highlighter className="size-5" />
          </ComposerButton>
          <ComposerButton label={t.channel.mentionPerson} onClick={() => appendTrigger("@")}>
            <AtSign className="size-5" />
          </ComposerButton>
          <ComposerButton label={t.channel.useCommand} onClick={() => appendTrigger("/")}>
            <SquareSlash className="size-5" />
          </ComposerButton>
          <ComposerButton
            label={t.common.send}
            type="submit"
            isDisabled={!canSend || isPending}
            className={canSend ? "text-primary" : "opacity-40"}
          >
            {isPending ? <LoaderCircle className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </ComposerButton>
        </div>
      </div>
      {state.code === ALREADY_SENT_CODE && quoteIds.length ? (
        <p role="alert" className="mt-1 flex flex-wrap items-center gap-2 px-1 text-[0.78125rem] text-proposed">
          {state.error}
          <button
            type="submit"
            name="confirm"
            value="1"
            className="rounded border border-proposed-line px-2 py-0.5 font-medium hover:bg-proposed-soft"
          >
            {t.channel.sendAnyway}
          </button>
        </p>
      ) : (
        <p className="mt-1 px-1 text-[0.71875rem] text-subtle">{!isOnline ? t.channel.offline : t.channel.composerHint}</p>
      )}
    </form>
  );
}

function ComposerButton({
  label,
  onClick,
  type = "button",
  isDisabled,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  isDisabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default",
        className,
      )}
    >
      {children}
    </button>
  );
}
