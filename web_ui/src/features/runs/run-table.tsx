// Bảng các lượt chạy ADOM đã nhập.
import Link from "next/link";
import { Database, FlaskConical, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { validityMeta } from "@/lib/status";
import type { Run } from "@/lib/types";

export interface RunRow {
  run: Run;
  importerName?: string;
}

export function RunTable({ rows, workspaceId }: { rows: RunRow[]; workspaceId: string }) {
  return (
    <Panel
      title="Lượt chạy đã nhập"
      icon={<Database />}
      actions={
        <Button size="sm">
          <Upload /> Nhập báo cáo
        </Button>
      }
    >
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b text-left text-xs text-subtle">
            <th className="py-2 font-normal">Lượt chạy</th>
            <th className="py-2 font-normal">Biến thể</th>
            <th className="py-2 text-right font-normal">Tác vụ</th>
            <th className="py-2 text-right font-normal">Vi phạm</th>
            <th className="py-2 pl-6 font-normal">Trạng thái</th>
            <th className="py-2 font-normal">Nhập bởi</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ run: r, importerName }) => (
            <tr key={r.id} className="border-b">
              <td className="py-2.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <FlaskConical className="size-4 text-data" /> {r.name}
                </span>
              </td>
              <td className="py-2.5 font-mono text-xs text-muted-foreground">{r.variants.join(" · ")}</td>
              <td className="tabular py-2.5 text-right">{r.tasks}</td>
              <td className="tabular py-2.5 text-right">{r.violations.join(" · ")}</td>
              <td className="py-2.5 pl-6">
                <ToneBadge tone={validityMeta[r.validity].tone} solid>
                  {r.validity !== "valid" ? <TriangleAlert /> : null} {validityMeta[r.validity].label}
                </ToneBadge>
              </td>
              <td className="py-2.5 text-muted-foreground">
                {importerName} · {r.importedAt}
              </td>
              <td className="py-2.5 text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/w/${workspaceId}/metrics`}>Mở bảng số liệu</Link>
                </Button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-2.5 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FlaskConical className="size-4 text-subtle" /> MAIN2
              </span>
            </td>
            <td colSpan={6} className="py-2.5 text-xs text-muted-foreground">
              Chưa có. Nhập khi lượt chạy lại hoàn tất.
            </td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}
