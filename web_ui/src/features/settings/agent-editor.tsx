// Form sửa cấu hình một agent.
"use client";

import { ChevronDown, KeyRound, Pencil, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl, type SegmentOption } from "@/components/common/segmented-control";
import { agentRoleMeta } from "@/lib/status";
import type { Agent, AgentRole } from "@/lib/types";
import { budgetLevel } from "./budget";

const ROLE_OPTIONS: SegmentOption<AgentRole>[] = (["generator", "critic", "synthesizer", "custom"] as const).map((r) => ({
  value: r,
  label: agentRoleMeta[r].label,
}));

export function AgentEditor({ agent, onCancel }: { agent: Agent; onCancel?: () => void }) {
  const [role, setRole] = useState<AgentRole>(agent.role);
  const [key, setKey] = useState("");
  const lvl = budgetLevel(agent.spentUsd, agent.budgetUsd);

  return (
    <section className="rounded-lg bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Pencil className="size-4 text-primary" /> Sửa @{agent.handle}
      </h2>
      {lvl.warn ? (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-rejected-line bg-rejected-soft px-3 py-2 text-xs text-rejected">
          <TriangleAlert className="size-3.5" />
          Đã dùng {Math.round((agent.spentUsd / agent.budgetUsd) * 100)}% trần. Chạm trần thì agent từ chối và báo lý do trong
          kênh.
        </p>
      ) : null}
      <div className="mt-3 grid gap-3">
        <div className="grid gap-1.5">
          <Label>Vai</Label>
          <SegmentedControl
            aria-label="Vai"
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
            className="grid grid-cols-4 gap-1 p-1"
            itemClassName="py-1.5 text-[13px]"
          />
        </div>
        <div className="grid grid-cols-[1fr_200px] gap-3">
          <div className="grid gap-1.5">
            <Label>Nhà cung cấp và mô hình</Label>
            <button type="button" className="flex h-9 items-center justify-between rounded-lg border bg-card px-3 text-sm">
              {agent.provider} · <span className="font-mono">{agent.model}</span>
              <ChevronDown className="ml-auto size-4 text-subtle" />
            </button>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="budget">Trần chi phí (USD)</Label>
            <Input id="budget" defaultValue={agent.budgetUsd.toFixed(2)} inputMode="decimal" className="tabular h-9" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="api-key">
            Khóa API <span className="font-normal text-muted-foreground">· chỉ ghi, không hiện lại sau khi lưu</span>
          </Label>
          <div className="relative">
            <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={`Dán khóa mới để thay khóa đang dùng (••••${agent.keyLast4})`}
              className="h-9 pl-9"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="prompt">Chỉ dẫn cho vai này</Label>
          <Textarea id="prompt" rows={2} defaultValue={agent.systemPrompt} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
          <Button>Lưu thay đổi</Button>
        </div>
      </div>
    </section>
  );
}
