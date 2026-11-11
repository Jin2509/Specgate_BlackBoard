// Menu gợi ý agent, người và lệnh nổi trên ô soạn.
"use client";

import type { ReactNode } from "react";
import { ActorAvatar, AiTag } from "@/components/common/actor-avatar";
import { agentRoleMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { CommandSuggestion, Suggestion } from "./suggestions";

export function SuggestionMenu({
  items,
  activeIndex,
  onPick,
  className,
}: {
  items: Suggestion[];
  activeIndex: number;
  onPick: (s: Suggestion) => void;
  className?: string;
}) {
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

type ListProps = { items: Suggestion[]; activeIndex: number; onPick: (s: Suggestion) => void };

function MentionList({ items, activeIndex, onPick }: ListProps) {
  return (
    <>
      <MenuLabel>Gọi một agent</MenuLabel>
      {items.map((s, i) =>
        s.kind === "agent" ? (
          <MenuRow key={s.agent.id} active={i === activeIndex} onPick={() => onPick(s)}>
            <ActorAvatar kind="agent" size="xs" />
            <span className="font-medium">@{s.agent.handle}</span>
            <AiTag />
            <span className="text-xs text-subtle">{agentRoleMeta[s.agent.role].label}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{s.agent.model}</span>
          </MenuRow>
        ) : null,
      )}
      {items.some((s) => s.kind === "person") ? <MenuLabel>Nhắc một người</MenuLabel> : null}
      {items.map((s, i) =>
        s.kind === "person" ? (
          <MenuRow key={s.person.id} active={i === activeIndex} onPick={() => onPick(s)}>
            <ActorAvatar kind="human" initial={s.person.initial} size="xs" />
            <span className="font-medium">@{s.person.displayName}</span>
          </MenuRow>
        ) : null,
      )}
    </>
  );
}

function CommandList({ items, activeIndex, onPick }: ListProps) {
  const commands = items.filter((s): s is CommandSuggestion => s.kind === "command");
  const core = commands.filter((s) => !s.command.module);
  const moduleCmds = commands.filter((s) => s.command.module);
  const row = (s: CommandSuggestion) => (
    <CommandRow key={s.command.name} s={s} active={items.indexOf(s) === activeIndex} onPick={onPick} />
  );

  return (
    <>
      <MenuLabel>Lệnh</MenuLabel>
      {core.map(row)}
      {moduleCmds.length > 0 ? <MenuLabel>Dữ kiện ADOM · chỉ có ở workspace đã gắn</MenuLabel> : null}
      {moduleCmds.map(row)}
    </>
  );
}

function CommandRow({ s, active, onPick }: { s: CommandSuggestion; active: boolean; onPick: (s: Suggestion) => void }) {
  const Icon = s.command.icon;
  const isModule = Boolean(s.command.module);
  return (
    <MenuRow active={active} onPick={() => onPick(s)}>
      <Icon className={cn("size-4", isModule ? "text-data" : "text-subtle")} />
      <code
        className={cn(
          "rounded px-1 font-mono text-[12px]",
          isModule ? "bg-data-soft text-data" : "bg-input text-sidebar-accent-foreground",
        )}
      >
        {s.command.name}
      </code>
      <span className="ml-auto text-xs text-muted-foreground">{s.command.description}</span>
    </MenuRow>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2 pt-1 pb-1.5 text-xs font-bold tracking-wide text-subtle uppercase">{children}</p>;
}

function MenuRow({ active, onPick, children }: { active: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(e) => {
        e.preventDefault();
        onPick();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted-foreground",
        active ? "bg-accent text-sidebar-accent-foreground" : "hover:bg-hover",
      )}
    >
      {children}
    </button>
  );
}
