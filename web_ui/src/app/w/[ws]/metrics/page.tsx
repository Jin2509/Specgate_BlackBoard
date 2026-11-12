// Trang bảng số liệu ADOM: sáu tiêu chí (màn 13).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CriteriaLegend } from "@/features/metrics/criteria-legend";
import { CriterionCard } from "@/features/metrics/criterion-card";
import { MetricsShell } from "@/features/metrics/metrics-shell";
import { countCriterionIdeas, getCriteria, getRuns } from "@/lib/mock/queries";
import { requireSharedWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Bảng số liệu" };

export default async function MetricsPage({ params }: PageProps<"/w/[ws]/metrics">) {
  const ws = await requireSharedWorkspace(params);
  const run = getRuns(ws.id)[0];
  if (!run) notFound();

  return (
    <MetricsShell run={run} workspaceId={ws.id} tab="criteria">
      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {getCriteria().map((c) => (
          <CriterionCard key={c.number} c={c} workspaceId={ws.id} decidedIdeas={countCriterionIdeas(c.number)} />
        ))}
      </div>
      <CriteriaLegend />
    </MetricsShell>
  );
}
