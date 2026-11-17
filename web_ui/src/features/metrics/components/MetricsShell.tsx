// Frames the metrics pages: tabs, a run banner that states validity first, and the run details bar.
import { FlaskConical, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { ToneBadge } from "@/components/ToneBadge";
import { format, t } from "@/lib/i18n";
import type { PaperRun } from "@/types/run";
import { cn } from "@/utils/cn";

import { RunStatusBar } from "./RunStatusBar";

export type MetricsTab = "criteria" | "repairs";

export function MetricsShell({
  run,
  runs,
  workspaceId,
  tab,
  children,
}: {
  run: PaperRun;
  runs: PaperRun[];
  workspaceId: string;
  tab: MetricsTab;
  children: ReactNode;
}) {
  const basePath = `/w/${workspaceId}/metrics`;
  const runQuery = `?run=${run.id}`;
  const otherDoneRuns = runs.filter((other) => other.status === "done" && other.id !== run.id);
  const isValid = run.validity === "valid";

  return (
    <PageLayout>
      <PageHeader
        icon={<FlaskConical />}
        title={t.metrics.pageTitle}
        meta={format(t.metrics.headerMeta, { dataset: run.dataset, run: run.name })}
        actions={
          <nav className="flex gap-1 text-sm">
            <TabLink href={`${basePath}${runQuery}`} isActive={tab === "criteria"}>
              {t.metrics.tabCriteria}
            </TabLink>
            <TabLink href={`${basePath}/repairs${runQuery}`} isActive={tab === "repairs"}>
              {t.metrics.tabRepairs}
            </TabLink>
          </nav>
        }
      />
      <PageBody className="space-y-4">
        <div
          role={isValid ? undefined : "alert"}
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-lg border-l-4 px-4 py-3 text-[13px]",
            isValid ? "border-decided bg-decided-soft" : "border-rejected bg-rejected-soft",
          )}
        >
          {isValid ? null : <TriangleAlert className="size-4 shrink-0 text-rejected" />}
          <span className="font-semibold">
            {format(t.metrics.runBanner, { run: run.name, dataset: run.dataset, count: run.tasks })}
          </span>
          {run.kind === "trial" ? <ToneBadge tone="neutral">{t.channel.trial}</ToneBadge> : null}
          <span>
            {isValid
              ? t.metrics.validRun
              : format(t.metrics.invalidRun, { reason: run.invalidReason ?? t.metrics.unknownReason })}
          </span>
          {otherDoneRuns.length > 0 ? (
            <span className="ml-auto flex flex-wrap items-center gap-1 text-xs">
              {t.metrics.otherRuns}
              {otherDoneRuns.map((other) => (
                <Link
                  key={other.id}
                  href={`${basePath}${tab === "repairs" ? "/repairs" : ""}?run=${other.id}`}
                  className="rounded bg-card px-1.5 py-0.5 hover:underline"
                >
                  {other.name}
                </Link>
              ))}
            </span>
          ) : null}
        </div>
        <RunStatusBar run={run} />
        {children}
      </PageBody>
    </PageLayout>
  );
}

function TabLink({ href, isActive, children }: { href: string; isActive: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1",
        isActive
          ? "bg-accent font-medium text-sidebar-accent-foreground"
          : "text-subtle hover:bg-hover hover:text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
