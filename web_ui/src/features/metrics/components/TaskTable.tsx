"use client";
// Lists violations per task, filterable by contribution and sortable by count.
import { ArrowDownWideNarrow, ChartBar, Table2 } from "lucide-react";
import { useState } from "react";

import { LegendSwatch } from "@/components/LegendSwatch";
import { SegmentedControl, type SegmentOption } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { format, t } from "@/lib/i18n";
import type { TaskResult } from "@/types/run";
import { cn } from "@/utils/cn";

import { listFilteredTasks, type SortOrder, type TaskFilter } from "../utils/filter-tasks";

const COLLAPSED_ROW_COUNT = 15;

const FILTERS: ReadonlyArray<SegmentOption<TaskFilter>> = [
  { value: "all", label: t.metrics.filterAll },
  { value: "contributing", label: t.metrics.filterContributing },
  { value: "other", label: t.metrics.filterOther },
];

export function TaskTable({
  tasks,
  totalViolations,
  totalTasks,
}: {
  tasks: TaskResult[];
  totalViolations: number;
  totalTasks: number;
}) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [order, setOrder] = useState<SortOrder>("descending");
  const [isExpanded, setIsExpanded] = useState(false);
  const maxViolations = Math.max(1, ...tasks.map((task) => task.violations));
  const contributingCount = tasks.filter((task) => task.contributing).length;
  const sortedTasks = listFilteredTasks(tasks, filter, order);
  const visibleTasks = isExpanded ? sortedTasks : sortedTasks.slice(0, COLLAPSED_ROW_COUNT);

  return (
    <section className="min-w-0 rounded-lg bg-card">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2 whitespace-nowrap">
        <ChartBar className="size-4 text-subtle" />
        <h2 className="text-[13px] font-semibold text-subtle">{t.metrics.violationsByTask}</h2>
        <span className="text-xs text-subtle">
          {format(t.metrics.violationsSummary, {
            violations: totalViolations,
            shown: visibleTasks.length,
            total: sortedTasks.length,
          })}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <SegmentedControl
            aria-label={t.metrics.filterTasks}
            value={filter}
            onChange={setFilter}
            options={FILTERS}
            className="flex p-0.5 text-xs"
            itemClassName="px-2 py-0.5"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.metrics.reverseOrder}
            onClick={() => setOrder((current) => (current === "descending" ? "ascending" : "descending"))}
          >
            <ArrowDownWideNarrow className={cn(order === "ascending" && "rotate-180")} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsExpanded((expanded) => !expanded)}>
            <Table2 />{" "}
            {isExpanded ? t.metrics.collapse : format(t.metrics.showAll, { count: Math.min(sortedTasks.length, totalTasks) })}
          </Button>
        </div>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b text-left text-[11px] text-subtle">
            <th className="px-4 py-1.5 font-normal">{t.metrics.columnTask}</th>
            <th className="w-[45%] py-1.5 font-normal">{t.metrics.columnViolations}</th>
            <th className="py-1.5 text-right font-normal">{t.metrics.columnShare}</th>
            <th className="py-1.5 pl-4 font-normal">a3_state</th>
          </tr>
        </thead>
        <tbody>
          {visibleTasks.map((task) => (
            <tr key={task.taskId} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-hover">
              <td className="px-4 py-1.5 font-mono">{task.taskId}</td>
              <td className="py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-input">
                    <span
                      className={cn("block h-full rounded-full", task.contributing ? "bg-data" : "bg-subtle/50")}
                      style={{ width: `${(task.violations / maxViolations) * 100}%` }}
                    />
                  </span>
                  <span className="tabular w-8 text-right">{task.violations}</span>
                </div>
              </td>
              <td className="tabular py-1.5 text-right text-muted-foreground">{task.share.toFixed(1)}%</td>
              <td className="py-1.5 pl-4 font-mono text-[11px] text-muted-foreground">{task.a3State}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[11px] text-muted-foreground">
        <LegendSwatch swatchClassName="bg-data">
          {format(t.metrics.legendContributing, { count: contributingCount })}
        </LegendSwatch>
        <LegendSwatch swatchClassName="bg-subtle/50">{t.metrics.legendNotContributing}</LegendSwatch>
      </p>
    </section>
  );
}
