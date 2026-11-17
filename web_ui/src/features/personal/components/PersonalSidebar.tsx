"use client";
// Lists the personal workspace: the agent, conversations (a team icon means team context), highlights, key and model.
import { Bot, ChevronRight, Highlighter, KeyRound, MessageSquare, SquarePen, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NavGroup } from "@/components/NavGroup";
import { NavItem } from "@/components/NavItem";
import { t } from "@/lib/i18n";
import type { ProviderKey } from "@/types/agent";
import type { ConversationSummary } from "@/types/conversation";
import { cn } from "@/utils/cn";

export function PersonalSidebar({
  home,
  providerKey,
  conversations,
  privateHighlightCount,
  agentHighlightCount,
  footer,
}: {
  home: string;
  providerKey: ProviderKey | null;
  conversations: ConversationSummary[];
  privateHighlightCount: number;
  agentHighlightCount: number;
  footer: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <h2 className="flex-1 truncate text-[15px] font-semibold text-sidebar-accent-foreground">{t.personal.sidebarTitle}</h2>
        <Link
          href={home}
          aria-label={t.personal.newConversation}
          title={t.personal.newConversation}
          className="rounded p-1 text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <SquarePen className="size-4.5" />
        </Link>
      </div>

      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <Link
          href={`${home}/key`}
          aria-label={t.personal.openKeySettings}
          className={cn(
            "group/agent mx-1 mt-3 flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            providerKey
              ? "hover:bg-hover"
              : "border border-dashed border-proposed-line bg-proposed-soft/40 hover:bg-proposed-soft",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              providerKey ? "bg-agent-soft text-agent" : "bg-proposed-soft text-proposed",
            )}
          >
            {providerKey ? <Bot className="size-4" /> : <KeyRound className="size-4" />}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[11px] font-medium tracking-wide text-subtle uppercase">
              {providerKey ? t.personal.yourAgent : t.personal.noApiKey}
            </span>
            <span className="block truncate text-[13px] text-foreground">
              {providerKey ? <span className="font-mono">{providerKey.model}</span> : t.personal.enterKeyToStart}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover/agent:translate-x-0.5" />
        </Link>

        <NavGroup label={t.personal.conversations}>
          {conversations.map((conversation) => (
            <NavItem
              key={conversation.id}
              href={`${home}/${conversation.id}`}
              isActive={pathname === `${home}/${conversation.id}`}
              icon={conversation.workspaceId ? <Users /> : <MessageSquare />}
            >
              {conversation.title}
            </NavItem>
          ))}
          {conversations.length === 0 ? <p className="px-2 py-1 text-xs text-subtle">{t.personal.noConversations}</p> : null}
        </NavGroup>

        <NavGroup label={t.personal.filterIdeas}>
          <NavItem
            href={`${home}/highlights`}
            isActive={pathname === `${home}/highlights`}
            icon={<Highlighter />}
            count={privateHighlightCount}
          >
            {t.personal.privateHighlights}
          </NavItem>
          <NavItem
            href={`${home}/agent-highlights`}
            isActive={pathname === `${home}/agent-highlights`}
            icon={<Bot />}
            count={agentHighlightCount}
          >
            {t.personal.agentHighlights}
          </NavItem>
          <NavItem href={`${home}/key`} isActive={pathname === `${home}/key`} icon={<KeyRound />}>
            {t.personal.keyAndModel}
          </NavItem>
        </NavGroup>
      </div>

      {footer}
    </aside>
  );
}
