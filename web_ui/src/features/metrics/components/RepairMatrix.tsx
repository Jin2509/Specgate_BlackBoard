// Compares spec repair outcomes of each method.
import { Wrench } from "lucide-react";

import { LegendSwatch } from "@/components/LegendSwatch";
import { Panel } from "@/components/Panel";
import { t } from "@/lib/i18n";
import type { RepairRow } from "@/types/run";
import { cn } from "@/utils/cn";

const COLUMNS = [
  { key: "good", label: t.metrics.repairGood, toneClassName: "text-decided" },
  { key: "wrongSide", label: t.metrics.repairWrongSide, toneClassName: "" },
  { key: "overRelax", label: t.metrics.repairOverRelax, toneClassName: "text-rejected" },
  { key: "unmeasured", label: t.metrics.repairUnmeasured, toneClassName: "" },
  { key: "noCandidate", label: t.metrics.repairNoCandidate, toneClassName: "" },
  { key: "notRepaired", label: t.metrics.repairNotRepaired, toneClassName: "" },
] as const;

function toRowTotal(row: RepairRow): number {
  return COLUMNS.reduce((sum, column) => sum + row[column.key], 0);
}

export function RepairMatrix({ rows }: { rows: RepairRow[] }) {
  return (
    <Panel
      title={t.metrics.repairTitle}
      icon={<Wrench />}
      bodyClassName="overflow-x-auto"
      actions={<span className="text-xs text-muted-foreground">{t.metrics.repairSubtitle}</span>}
    >
      <table className="w-full min-w-160 text-[13px]">
        <thead>
          <tr className="border-b text-xs text-subtle">
            <th className="py-2 text-left font-normal">{t.metrics.method}</th>
            <th className="w-[38%] py-2 font-normal" />
            {COLUMNS.map((column) => (
              <th key={column.key} className="py-2 text-right font-normal">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const total = toRowTotal(row) || 1;
            const toWidth = (count: number) => `${(count / total) * 100}%`;
            return (
              <tr key={row.method} className="border-b last:border-0">
                <td className="py-2.5 font-mono text-xs">{row.method}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    <span className="bg-decided" style={{ width: toWidth(row.good) }} />
                    <span className="bg-rejected" style={{ width: toWidth(row.overRelax) }} />
                    <span className="bg-subtle/35" style={{ width: toWidth(row.unmeasured) }} />
                  </div>
                </td>
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "tabular py-2.5 text-right",
                      row[column.key] > 0 ? column.toneClassName : "text-muted-foreground",
                    )}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <LegendSwatch swatchClassName="bg-decided">{t.metrics.legendGood}</LegendSwatch>
        <LegendSwatch swatchClassName="bg-rejected">{t.metrics.legendOverRelax}</LegendSwatch>
        <LegendSwatch swatchClassName="bg-subtle/35">{t.metrics.legendUnmeasured}</LegendSwatch>
      </p>
    </Panel>
  );
}
