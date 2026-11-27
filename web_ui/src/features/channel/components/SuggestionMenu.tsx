"use client";
// Floats the people and command suggestions above the composer.
import { Highlighter } from "lucide-react";
import type { ReactNode } from "react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

import type { CommandSuggestion, Suggestion } from "../utils/suggestions";

interface SuggestionListProps {
  items: Suggestion[];
  activeIndex: number;
  onPick: (suggestion: Suggestion) => void;
}

export function SuggestionMenu({ items, activeIndex, onPick, className }: SuggestionListProps & { className?: string }) {
  return (
    <div role="listbox" className={cn("absolute z-20 rounded-lg bg-card p-2 shadow-float", className)}>
      {items[0]?.kind === "command" ? (
        <CommandList items={items} activeIndex={activeIndex} onPick={onPick} />
      ) : (
        <MentionList items={items} activeIndex={activeIndex} onPick={onPick} />
      )}
    </div>
  );
}

function MentionList({ items, activeIndex, onPick }: SuggestionListProps) {
  return (
    <>
      {items[0]?.kind === "highlights" ? (
        <>
          <MenuLabel>{t.channel.yours}</MenuLabel>
          <MenuRow isActive={activeIndex === 0} onPick={() => onPick(items[0])}>
            <Highlighter className="size-4 text-subtle" />
            <span className="font-medium">{t.channel.myHighlights}</span>
            <span className="ml-auto text-xs text-muted-foreground">{t.channel.insertPrivateHighlight}</span>
          </MenuRow>
        </>
      ) : null}
      {items.some((suggestion) => suggestion.kind === "person") ? <MenuLabel>{t.channel.mentionPerson}</MenuLabel> : null}
      {items.map((suggestion, index) =>
        suggestion.kind === "person" ? (
          <MenuRow key={suggestion.person.id} isActive={index === activeIndex} onPick={() => onPick(suggestion)}>
            <ActorAvatar kind="human" initial={suggestion.person.initial} colorIndex={suggestion.person.color} size="xs" />
            <span className="font-medium">@{suggestion.person.displayName}</span>
          </MenuRow>
        ) : null,
      )}
    </>
  );
}

function CommandList({ items, activeIndex, onPick }: SuggestionListProps) {
  const commands = items.filter((suggestion): suggestion is CommandSuggestion => suggestion.kind === "command");
  const toRow = (suggestion: CommandSuggestion) => (
    <CommandRow
      key={suggestion.command.name}
      suggestion={suggestion}
      isActive={items.indexOf(suggestion) === activeIndex}
      onPick={onPick}
    />
  );

  return (
    <>
      <MenuLabel>{t.channel.commandsLabel}</MenuLabel>
      {commands.map(toRow)}
    </>
  );
}

function CommandRow({
  suggestion,
  isActive,
  onPick,
}: {
  suggestion: CommandSuggestion;
  isActive: boolean;
  onPick: (suggestion: Suggestion) => void;
}) {
  const Icon = suggestion.command.icon;
  return (
    <MenuRow isActive={isActive} onPick={() => onPick(suggestion)}>
      <Icon className="size-4 text-subtle" />
      <code className="rounded bg-input px-1 font-mono text-[0.75rem] text-sidebar-accent-foreground">
        {suggestion.command.name}
      </code>
      <span className="ml-auto text-xs text-muted-foreground">{suggestion.command.description}</span>
    </MenuRow>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2 pt-1 pb-1.5 text-[0.78125rem] font-semibold text-subtle">{children}</p>;
}

function MenuRow({ isActive, onPick, children }: { isActive: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onMouseDown={(event) => {
        event.preventDefault();
        onPick();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted-foreground",
        isActive ? "bg-accent text-sidebar-accent-foreground" : "hover:bg-hover",
      )}
    >
      {children}
    </button>
  );
}
