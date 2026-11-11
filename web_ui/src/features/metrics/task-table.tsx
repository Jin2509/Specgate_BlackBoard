// Bảng vi phạm theo tác vụ, lọc và sắp xếp được.
"use client";

import { ArrowDownWideNarrow, ChartBar, Table2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LegendSwatch } from "@/components/common/legend-swatch";
import { SegmentedControl, type SegmentOption } from "@/components/common/segmented-control";
import type { TaskResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "contributing" | "other";

const FILTERS: SegmentOption<Filter>[] = [
  { value: "all", label: "Tất cả" },
  { value: "contributing", label: "Đóng góp" },
  { value: "other", label: "Không đóng góp" },
];

export function filterTasks(tasks: TaskResult[], filter: Filter, desc: boolean): TaskResult[] {
  return tasks
    .filter((t) => filter === "all" || (filter === "contributing" ? t.contributing : !t.contributing))
    .sort((a, b) => (desc ? b.violations - a.violations : a.violations - b.violations));
}

export function TaskTable({
  tasks,
  totalViolations,
  totalTasks,
}: {
  tasks: TaskResult[];
  totalViolations: number;
  totalTasks: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [desc, setDesc] = useState(true);
  const max = Math.max(...tasks.map((t) => t.violations));
  const rows = filterTasks(tasks, filter, desc);

  return (
    <section className="min-w-0 rounded-lg bg-card">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2 whitespace-nowrap">
        <ChartBar className="size-4 text-subtle" />
        <h2 className="text-xs font-bold tracking-wide text-subtle uppercase">Vi phạm theo tác vụ</h2>
        <span className="text-xs text-subtle">
          {totalViolations} vi phạm · {tasks.length} đầu
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <SegmentedControl
            aria-label="Lọc tác vụ"
            value={filter}
            onChange={setFilter}
            options={FILTERS}
            className="flex p-0.5 text-xs"
            itemClassName="px-2 py-0.5"
          />
          <Button variant="ghost" size="icon-sm" aria-label="Đảo thứ tự" onClick={() => setDesc((d) => !d)}>
            <ArrowDownWideNarrow className={cn(!desc && "rotate-180")} />
          </Button>
          <Button variant="secondary" size="sm">
            <Table2 /> Xem cả {totalTasks}
          </Button>
        </div>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b text-left text-[11px] text-subtle">
            <th className="px-4 py-1.5 font-normal">Tác vụ</th>
            <th className="w-[45%] py-1.5 font-normal">Vi phạm</th>
            <th className="py-1.5 text-right font-normal">Tỷ lệ</th>
            <th className="py-1.5 pl-4 font-normal">a3_state</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.taskId} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-hover">
              <td className="px-4 py-1.5 font-mono">{t.taskId}</td>
              <td className="py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-input">
                    <span
                      className={cn("block h-full rounded-full", t.contributing ? "bg-data" : "bg-subtle/50")}
                      style={{ width: `${(t.violations / max) * 100}%` }}
                    />
                  </span>
                  <span className="tabular w-8 text-right">{t.violations}</span>
                </div>
              </td>
              <td className="tabular py-1.5 text-right text-muted-foreground">{t.share.toFixed(1)}%</td>
              <td className="py-1.5 pl-4 font-mono text-[11px] text-muted-foreground">{t.a3State}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[11px] text-muted-foreground">
        <LegendSwatch swatchClassName="bg-data">đóng góp vào tiêu chí (10)</LegendSwatch>
        <LegendSwatch swatchClassName="bg-subtle/50">không đóng góp</LegendSwatch>
        <span>· riêng /38 chiếm 42,6%; ba tác vụ đầu chiếm 57,8%</span>
      </p>
    </section>
  );
}
