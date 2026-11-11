// Trang lượt chạy ADOM: danh sách và nhập báo cáo (màn 12).
import type { Metadata } from "next";
import { Database } from "lucide-react";
import { notFound } from "next/navigation";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { ImportReportForm } from "@/features/runs/import-report-form";
import { RunTable } from "@/features/runs/run-table";
import { WhyImportPanel } from "@/features/runs/why-import-panel";
import { getProfile, getRuns } from "@/lib/mock/queries";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Lượt chạy" };

export default async function RunsPage({ params }: PageProps<"/w/[ws]/runs">) {
  const ws = await requireWorkspace(params);
  if (!ws.modules.includes("adom")) notFound();
  const rows = getRuns(ws.id).map((run) => ({ run, importerName: getProfile(run.importedBy)?.displayName }));

  return (
    <PageLayout>
      <PageHeader icon={<Database />} title="Lượt chạy" meta="dữ kiện ADOM" />
      <PageBody className="space-y-4">
        <RunTable rows={rows} workspaceId={ws.id} />
        <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_380px]">
          <ImportReportForm />
          <WhyImportPanel />
        </div>
      </PageBody>
    </PageLayout>
  );
}
