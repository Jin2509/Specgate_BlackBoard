// Thẻ số liệu sáu tiêu chí do lệnh /stats đưa vào kênh.
import Link from "next/link";
import { ExternalLink, FlaskConical, TriangleAlert } from "lucide-react";
import { ToneBadge } from "@/components/common/tone-badge";
import { getCriteria, getRun } from "@/lib/mock/queries";
import { toneClasses, verdictMeta } from "@/lib/status";
import type { Criterion } from "@/lib/types";
import { cn } from "@/lib/utils";

function shortVerdict(c: Criterion): string {
  if (c.verdict === "PASS" || c.verdict === "FAIL") return c.verdict;
  return "thiếu";
}

export function StatsCard({ runId, workspaceId, className }: { runId: string; workspaceId: string; className?: string }) {
  const run = getRun(runId);
  if (!run) return null;
  const criteria = getCriteria();
  const count = (v: Criterion["verdict"]) => criteria.filter((c) => c.verdict === v).length;

  return (
    <div className={cn("max-w-140 rounded border-l-4 border-data bg-card p-3", className)}>
      <div className="flex items-center gap-2 text-xs">
        <FlaskConical className="size-3.5 text-data" />
        <span className="font-medium text-data">
          {run.name} · {run.primaryVariant} · {run.tasks} tác vụ
        </span>
        {run.validity === "invalidated" ? (
          <ToneBadge tone="rejected" className="ml-auto">
            <TriangleAlert /> invalidated
          </ToneBadge>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {criteria.map((c) => (
          <Link
            key={c.number}
            href={`/w/${workspaceId}/metrics#tieu-chi-${c.number}`}
            className={cn("rounded bg-input px-2 py-1.5 transition-colors hover:bg-accent", c.number === 3 && "ring-1 ring-data")}
          >
            <span className="tabular block font-mono text-[13px] font-semibold text-sidebar-accent-foreground">{c.display}</span>
            <span className={cn("block text-[10.5px]", toneClasses[verdictMeta[c.verdict].tone].text)}>
              {c.number} · {shortVerdict(c)}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-2 flex items-center text-xs text-subtle">
        {count("PASS")} đạt, {count("INSUFFICIENT_DATA")} thiếu dữ liệu, {count("FAIL")} không đạt
        <Link
          href={`/w/${workspaceId}/metrics`}
          className="ml-auto inline-flex items-center gap-1 font-medium text-primary-strong hover:underline"
        >
          <ExternalLink className="size-3" /> Mở bảng số liệu
        </Link>
      </div>
    </div>
  );
}
