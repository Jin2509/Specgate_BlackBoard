// Khám phá workspace chung: dán liên kết mời, tìm kiếm và xin tham gia.
"use client";

import { Compass, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { useQueryParam } from "@/hooks/use-query-param";
import type { BoardCard, JoinRelation, Workspace } from "@/lib/types";
import { InviteCodeForm } from "./invite-code-form";
import { JoinRequestForm } from "./join-request-form";
import { WorkspaceListItem } from "./workspace-list-item";

export function searchWorkspaces(workspaces: Workspace[], query: string): Workspace[] {
  const q = query.trim().toLowerCase();
  return workspaces.filter((w) => !q || w.name.toLowerCase().includes(q) || w.brief.toLowerCase().includes(q));
}

export function ExploreView({
  workspaces,
  relations,
  capsuleCandidates,
}: {
  workspaces: Workspace[];
  relations: Record<string, JoinRelation>;
  capsuleCandidates: BoardCard[];
}) {
  const blockedId = useQueryParam("ws");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const target = selected ?? blockedId ?? workspaces.find((w) => relations[w.id] !== "member")?.id;
  const shown = searchWorkspaces(workspaces, query);
  const targetWs = workspaces.find((w) => w.id === target);
  const blocked = workspaces.find((w) => w.id === blockedId && relations[w.id] !== "member");

  return (
    <PageLayout>
      <PageHeader icon={<Compass />} title="Khám phá" meta={`${workspaces.length} workspace chung cho phép xin vào`} />
      <PageBody className="grid content-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="@container flex min-w-0 flex-col gap-4">
          {blocked ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-proposed-soft px-4 py-3 text-sm text-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-proposed" />
              Bạn chưa là thành viên của “{blocked.name}”. Xin tham gia bên phải, hoặc dán liên kết mời nếu có.
            </p>
          ) : null}
          <div>
            <h2 className="text-xl font-bold text-sidebar-accent-foreground">Tìm nhóm cùng nghĩ</h2>
            <p className="mt-1 text-sm text-subtle">Có liên kết mời thì vào ngay. Không có thì tìm và gửi yêu cầu.</p>
          </div>
          <div className="grid gap-2 @xl:grid-cols-2">
            <InviteCodeForm />
            <div className="flex items-center gap-2 rounded-md bg-input px-3">
              <Search className="size-4 shrink-0 text-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc đề bài"
                aria-label="Tìm workspace"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
              />
            </div>
          </div>
          <div className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
            {shown.map((w) => (
              <WorkspaceListItem
                key={w.id}
                ws={w}
                relation={relations[w.id] ?? "none"}
                selected={w.id === target}
                onSelect={() => setSelected(w.id)}
              />
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
              Không có workspace nào khớp “{query.trim()}”.
            </p>
          ) : null}
        </div>

        {targetWs ? (
          <JoinRequestForm
            key={targetWs.id}
            target={targetWs}
            relation={relations[targetWs.id] ?? "none"}
            capsuleCandidates={capsuleCandidates}
          />
        ) : null}
      </PageBody>
    </PageLayout>
  );
}
