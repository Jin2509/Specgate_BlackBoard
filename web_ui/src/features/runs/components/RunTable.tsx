"use client";
// Lists the workspace runs (imports and trials) with their validity; the owner marks them invalid or removes them.
import { Database } from "lucide-react";

import { Panel } from "@/components/Panel";
import { t } from "@/lib/i18n";

import { RunRow, type LabelledRun } from "./RunRow";

export function RunTable({
  runs,
  currentRunId,
  workspaceId,
  canManage,
}: {
  runs: LabelledRun[];
  currentRunId: string | null;
  workspaceId: string;
  canManage: boolean;
}) {
  return (
    <Panel title={t.runs.tableTitle} icon={<Database />}>
      {runs.length === 0 ? (
        <p className="py-3 text-[13px] text-subtle">{t.runs.emptyTable}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-[13px]">
            <thead>
              <tr className="border-b text-left text-xs text-subtle">
                <th className="py-2 font-normal">{t.runs.columnRun}</th>
                <th className="py-2 font-normal">{t.runs.columnDataset}</th>
                <th className="py-2 text-right font-normal">{t.metrics.tasks}</th>
                <th className="py-2 text-right font-normal">{t.metrics.violations}</th>
                <th className="py-2 pl-6 font-normal">{t.runs.validity}</th>
                <th className="py-2 font-normal">{t.runs.columnBy}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  isCurrent={run.id === currentRunId}
                  workspaceId={workspaceId}
                  canManage={canManage}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
