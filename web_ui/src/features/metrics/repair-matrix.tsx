// Ma trận kết quả sửa đặc tả theo phương pháp.
import { Wrench } from "lucide-react";
import { LegendSwatch } from "@/components/common/legend-swatch";
import { Panel } from "@/components/common/panel";
import type { RepairRow } from "@/lib/types";

const COLS = [
  { key: "good", label: "Tốt", tone: "text-decided" },
  { key: "wrongSide", label: "Nhầm bên", tone: "" },
  { key: "overRelax", label: "Nới quá tay", tone: "text-rejected" },
  { key: "unmeasured", label: "Chưa đo được", tone: "" },
  { key: "noCandidate", label: "Không có ứng viên", tone: "" },
  { key: "notRepaired", label: "Không sửa", tone: "" },
] as const;

function rowTotal(r: RepairRow): number {
  return COLS.reduce((sum, c) => sum + r[c.key], 0);
}

export function RepairMatrix({ rows }: { rows: RepairRow[] }) {
  return (
    <Panel
      title="Kết quả sửa đặc tả theo phương pháp"
      icon={<Wrench />}
      bodyClassName="overflow-x-auto"
      actions={
        <span className="text-xs text-muted-foreground">
          131 vi phạm quy lỗi SPEC_FAULT · có Cổng và không Cổng cho cùng kết quả
        </span>
      }
    >
      <table className="w-full min-w-160 text-[13px]">
        <thead>
          <tr className="border-b text-xs text-subtle">
            <th className="py-2 text-left font-normal">Phương pháp</th>
            <th className="w-[38%] py-2 font-normal" />
            {COLS.map((c) => (
              <th key={c.key} className="py-2 text-right font-normal">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const total = rowTotal(r);
            const w = (n: number) => `${(n / total) * 100}%`;
            return (
              <tr key={r.method} className="border-b last:border-0">
                <td className="py-2.5 font-mono text-xs">{r.method}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    <span className="bg-decided" style={{ width: w(r.good) }} />
                    <span className="bg-rejected" style={{ width: w(r.overRelax) }} />
                    <span className="bg-subtle/35" style={{ width: w(r.unmeasured) }} />
                  </div>
                </td>
                {COLS.map((c) => (
                  <td key={c.key} className={`tabular py-2.5 text-right ${r[c.key] > 0 ? c.tone : "text-muted-foreground"}`}>
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <LegendSwatch swatchClassName="bg-decided">tốt</LegendSwatch>
        <LegendSwatch swatchClassName="bg-rejected">nới quá tay</LegendSwatch>
        <LegendSwatch swatchClassName="bg-subtle/35">chưa đo được: 104/130, thiếu vết dò độc lập</LegendSwatch>
      </p>
    </Panel>
  );
}
