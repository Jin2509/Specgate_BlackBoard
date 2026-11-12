// Bảng agent: vai, mô hình, khóa API, chi phí, bật/tắt.
"use client";

import { Terminal, KeyRound, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToneBadge } from "@/components/common/tone-badge";
import { agentRoleMeta } from "@/lib/status";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { budgetLevel } from "./budget";

export function AgentTable({
  agents,
  editingId,
  onToggle,
  onEdit,
}: {
  agents: Agent[];
  editingId?: string;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <section className="min-w-0 overflow-x-auto rounded-lg bg-card">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <Terminal className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Agent</h2>
        <Button variant="secondary" size="sm" className="ml-auto">
          <Plus /> Thêm agent
        </Button>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b text-left text-xs text-subtle">
            <th className="px-4 py-2 font-normal">Tên gọi</th>
            <th className="py-2 font-normal">Vai</th>
            <th className="py-2 font-normal">Mô hình</th>
            <th className="py-2 font-normal">Khóa API</th>
            <th className="py-2 font-normal">Đã dùng / trần</th>
            <th className="py-2 font-normal">Bật</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className={cn("border-b last:border-0", editingId === a.id && "bg-accent/50")}>
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Terminal className="size-4 text-agent" />@{a.handle}
                </span>
              </td>
              <td className="py-2.5">
                <ToneBadge tone="agent">{agentRoleMeta[a.role].label}</ToneBadge>
              </td>
              <td className="py-2.5 font-mono text-xs">{a.model}</td>
              <td className="py-2.5 font-mono text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <KeyRound className="size-3" />
                  ••••{a.keyLast4}
                </span>
              </td>
              <td className="py-2.5">
                <BudgetMeter spent={a.spentUsd} budget={a.budgetUsd} />
              </td>
              <td className="py-2.5">
                <Switch checked={a.enabled} onCheckedChange={(v) => onToggle(a.id, v)} aria-label={`Bật @${a.handle}`} />
              </td>
              <td className="py-2.5 pr-3 text-right">
                <Button variant="ghost" size="icon-sm" aria-label={`Sửa @${a.handle}`} onClick={() => onEdit(a.id)}>
                  <Pencil />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BudgetMeter({ spent, budget }: { spent: number; budget: number }) {
  const lvl = budgetLevel(spent, budget);
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full rounded-full", lvl.warn ? "bg-rejected" : "bg-primary")}
          style={{ width: `${lvl.ratio * 100}%` }}
        />
      </span>
      <span className={cn("tabular text-xs", lvl.warn ? "text-rejected" : "text-muted-foreground")}>
        ${spent.toFixed(2)} / ${budget.toFixed(2)}
      </span>
    </div>
  );
}
