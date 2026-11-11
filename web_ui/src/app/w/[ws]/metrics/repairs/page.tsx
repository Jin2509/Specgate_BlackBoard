// Trang bảng số liệu ADOM: kết quả sửa và theo tác vụ (màn 14).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MetricsShell } from "@/features/metrics/metrics-shell";
import { RepairMatrix } from "@/features/metrics/repair-matrix";
import { DraftAgreementPanel, RunCostPanel } from "@/features/metrics/run-side-panels";
import { TaskTable } from "@/features/metrics/task-table";
import { getDraftAgreement, getRepairRows, getRunCost, getRuns, getTaskResults } from "@/lib/mock/queries";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Sửa và tác vụ" };

export default async function RepairsPage({ params }: PageProps<"/w/[ws]/metrics/repairs">) {
  const ws = await requireWorkspace(params);
  const run = getRuns(ws.id)[0];
  if (!run) notFound();

  return (
    <MetricsShell run={run} workspaceId={ws.id} tab="repairs">
      <RepairMatrix rows={getRepairRows()} />
      <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_340px]">
        <TaskTable tasks={getTaskResults()} totalViolations={run.violations[0]} totalTasks={run.tasks} />
        <div className="space-y-4">
          <DraftAgreementPanel rows={getDraftAgreement()} />
          <RunCostPanel rows={getRunCost()} />
        </div>
      </div>
      <p className="text-xs text-subtle">
        Số liệu của biến thể lỗi tiêm không nằm ở đây: bài báo cấm gộp với lỗi tự nhiên, nên chúng có bảng riêng.
      </p>
    </MetricsShell>
  );
}
