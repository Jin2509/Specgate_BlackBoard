// Cột trái của workspace riêng: agent của bạn (mô hình đang dùng), hội thoại, highlight của tôi, key và mô hình.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Highlighter, KeyRound, MessageSquare, SquarePen, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { Conversation, ProviderKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NavGroup, NavItem } from "@/features/workspace-shell/sidebar-nav";

export function PersonalSidebar({
  home,
  providerKey,
  conversations,
  highlightCount,
  footer,
}: {
  home: string;
  providerKey: ProviderKey | undefined;
  conversations: Conversation[];
  highlightCount: number;
  footer: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <h2 className="flex-1 truncate text-[15px] font-semibold text-sidebar-accent-foreground">Workspace riêng</h2>
        <Link
          href={home}
          aria-label="Hội thoại mới"
          title="Hội thoại mới"
          className="rounded p-1 text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <SquarePen className="size-4.5" />
        </Link>
      </div>

      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <Link
          href={`${home}/key`}
          className={cn(
            "mx-1 mt-3 block rounded-md border px-3 py-2 transition-colors hover:bg-hover",
            providerKey ? "border-border" : "border-dashed border-proposed-line",
          )}
        >
          {providerKey ? (
            <>
              <span className="block text-xs text-subtle">Agent của bạn</span>
              <span className="block truncate font-mono text-[13px] text-foreground">{providerKey.model}</span>
            </>
          ) : (
            <>
              <span className="block text-[13px] font-medium text-foreground">Chưa có API key</span>
              <span className="block text-xs text-subtle">Nhập key để bắt đầu chat</span>
            </>
          )}
        </Link>

        <NavGroup label="Hội thoại">
          {conversations.map((c) => (
            <NavItem
              key={c.id}
              href={`${home}/${c.id}`}
              active={pathname === `${home}/${c.id}`}
              icon={c.workspaceId ? <Users /> : <MessageSquare />}
            >
              {c.title}
            </NavItem>
          ))}
          {conversations.length === 0 ? <p className="px-2 py-1 text-xs text-subtle">Chưa có hội thoại nào.</p> : null}
        </NavGroup>

        <NavGroup label="Ngữ cảnh nhóm">
          <NavItem
            href={`${home}/highlights`}
            active={pathname === `${home}/highlights`}
            icon={<Highlighter />}
            count={highlightCount}
          >
            Highlight của tôi
          </NavItem>
          <NavItem href={`${home}/key`} active={pathname === `${home}/key`} icon={<KeyRound />}>
            Key và mô hình
          </NavItem>
        </NavGroup>
      </div>

      {footer}
    </aside>
  );
}
