// Khối hai bản nháp A3 và khối chi phí lượt chạy.
import { GitCompareArrows, Timer } from "lucide-react";
import { Panel } from "@/components/common/panel";

export interface DraftAgreementRow {
  label: string;
  code: string;
  value: number;
}

export interface RunCostRow {
  variant: string;
  seconds: number;
  apiCalls: number;
  cacheHits: number;
}

export function DraftAgreementPanel({ rows }: { rows: DraftAgreementRow[] }) {
  return (
    <Panel title="Hai bản nháp A3" icon={<GitCompareArrows />}>
      <ul className="divide-y text-[13px]">
        {rows.map((d) => (
          <li key={d.code} className="flex items-center py-2">
            {d.label} <code className="ml-1.5 font-mono text-[11px] text-subtle">{d.code}</code>
            <span className="tabular ml-auto font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function RunCostPanel({ rows }: { rows: RunCostRow[] }) {
  return (
    <Panel title="Chi phí" icon={<Timer />}>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b text-xs text-subtle">
            <th className="py-1.5 text-left font-normal">Biến thể</th>
            <th className="py-1.5 text-right font-normal">Thời gian</th>
            <th className="py-1.5 text-right font-normal">Gọi API</th>
            <th className="py-1.5 text-right font-normal">Cache</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.variant} className="border-b last:border-0">
              <td className="py-2 font-mono text-xs">{c.variant}</td>
              <td className="tabular py-2 text-right">{c.seconds.toLocaleString("fr-FR")} s</td>
              <td className="tabular py-2 text-right">{c.apiCalls}</td>
              <td className="tabular py-2 text-right">{c.cacheHits}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">/38 chiếm 1 296 s của A1.</p>
    </Panel>
  );
}
