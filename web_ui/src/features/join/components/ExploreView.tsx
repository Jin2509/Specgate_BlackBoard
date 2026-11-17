"use client";
// Lets a person find shared workspaces: enter a join code, search, and ask to join the selected one.
import { Compass, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { format, t } from "@/lib/i18n";
import type { ExploreCard } from "@/types/join";

import { JoinCodeForm } from "./JoinCodeForm";
import { JoinRequestForm } from "./JoinRequestForm";
import { WorkspaceCardButton } from "./WorkspaceCardButton";
import { searchWorkspaces } from "../utils/search-workspaces";

/** `preselected` is the workspace a non-member just tried to open; it is selected on the right. */
export function ExploreView({ workspaces, preselected }: { workspaces: ExploreCard[]; preselected: ExploreCard | null }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blockedWorkspace = preselected && preselected.relation !== "member" ? preselected : null;
  const allWorkspaces =
    preselected && !workspaces.some((workspace) => workspace.id === preselected.id) ? [preselected, ...workspaces] : workspaces;
  const targetId = selectedId ?? blockedWorkspace?.id ?? allWorkspaces.find((workspace) => workspace.relation !== "member")?.id;
  const shownWorkspaces = searchWorkspaces(allWorkspaces, query);
  const targetWorkspace = allWorkspaces.find((workspace) => workspace.id === targetId);

  return (
    <PageLayout>
      <PageHeader
        icon={<Compass />}
        title={t.join.explorePageTitle}
        meta={format(t.join.exploreMeta, { count: workspaces.length })}
      />
      <PageBody className="grid content-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="@container flex min-w-0 flex-col gap-4">
          {blockedWorkspace ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-proposed-soft px-4 py-3 text-sm text-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-proposed" />
              {format(t.join.notMemberAlert, { name: blockedWorkspace.name })}
            </p>
          ) : null}
          <div>
            <h2 className="text-xl font-bold text-sidebar-accent-foreground">{t.join.exploreHeading}</h2>
            <p className="mt-1 text-sm text-subtle">{t.join.exploreLead}</p>
          </div>
          <div className="grid items-start gap-2 @xl:grid-cols-2">
            <JoinCodeForm />
            <div className="flex items-center gap-2 self-center rounded-md bg-input px-3">
              <Search className="size-4 shrink-0 text-subtle" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.join.searchPlaceholder}
                aria-label={t.join.searchLabel}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
              />
            </div>
          </div>
          <div className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
            {shownWorkspaces.map((workspace) => (
              <WorkspaceCardButton
                key={workspace.id}
                workspace={workspace}
                isSelected={workspace.id === targetId}
                onSelect={() => setSelectedId(workspace.id)}
              />
            ))}
          </div>
          {shownWorkspaces.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
              {allWorkspaces.length === 0 ? t.join.noOpenWorkspaces : format(t.join.noMatch, { query: query.trim() })}
            </p>
          ) : null}
        </div>

        {targetWorkspace ? <JoinRequestForm key={targetWorkspace.id} target={targetWorkspace} /> : null}
      </PageBody>
    </PageLayout>
  );
}
