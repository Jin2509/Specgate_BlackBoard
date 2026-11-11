// Khung chung của bảng số liệu ADOM: tiêu đề, tab, cảnh báo.
import Link from "next/link";
import { FlaskConical, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { ToneBadge } from "@/components/common/tone-badge";
import { validityMeta } from "@/lib/status";
import type { Run } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RunStatusBar } from "./run-status-bar";

export type MetricsTab = "criteria" | "repairs";

export function MetricsShell({
  run,
  workspaceId,
  tab,
  children,
}: {
  run: Run;
  workspaceId: string;
  tab: MetricsTab;
  children: ReactNode;
}) {
  const v = validityMeta[run.validity];
  const base = `/w/${workspaceId}/metrics`;

  return (
    <PageLayout>
      <PageHeader
        icon={<FlaskConical />}
        title="Bảng số liệu ADOM"
        meta={`${run.dataset} · lượt ${run.name}`}
        actions={
          <>
            <nav className="flex gap-1 text-sm">
              <TabLink href={base} active={tab === "criteria"}>
                Tiêu chí
              </TabLink>
              <TabLink href={`${base}/repairs`} active={tab === "repairs"}>
                Sửa và tác vụ
              </TabLink>
            </nav>
            <ToneBadge tone={v.tone} solid>
              {run.validity === "invalidated" ? <TriangleAlert /> : null}
              {v.label}
            </ToneBadge>
          </>
        }
      />
      <PageBody className="space-y-4">
        {tab === "criteria" ? (
          <>
            {run.validity === "invalidated" ? <InvalidatedAlert reason={run.invalidReason} /> : null}
            <RunStatusBar run={run} />
          </>
        ) : null}
        {children}
      </PageBody>
    </PageLayout>
  );
}

function InvalidatedAlert({ reason }: { reason?: string }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border-l-4 border-rejected bg-rejected-soft px-4 py-3 text-[13px] text-foreground"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold">Lượt chạy này đã bị vô hiệu.</span> {reason}
      </p>
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1",
        active
          ? "bg-accent font-medium text-sidebar-accent-foreground"
          : "text-subtle hover:bg-hover hover:text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
