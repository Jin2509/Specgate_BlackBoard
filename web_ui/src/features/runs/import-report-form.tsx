// Form nhập báo cáo lượt chạy ADOM.
"use client";

import { Check, FileJson, FileSpreadsheet, FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl, type SegmentOption } from "@/components/common/segmented-control";
import { ToneBadge } from "@/components/common/tone-badge";
import type { Validity } from "@/lib/types";

const FILES = [
  { name: "MAIN_summary.csv", detail: "116 dòng", icon: FileSpreadsheet },
  { name: "MAIN_per_task.csv", detail: "324 dòng", icon: FileSpreadsheet },
  { name: "MAIN_run_meta.json", detail: "2 biến thể", icon: FileJson },
];

const VALIDITY_OPTIONS: SegmentOption<Validity>[] = [
  { value: "valid", label: "valid", activeClassName: "text-decided" },
  { value: "invalidated", label: "invalidated", activeClassName: "text-rejected" },
  { value: "pilot", label: "pilot", activeClassName: "text-foreground" },
];

export function ImportReportForm() {
  const [validity, setValidity] = useState<Validity>("invalidated");

  return (
    <section className="min-w-0 rounded-lg bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <FileUp className="size-4 text-subtle" /> Nhập báo cáo ADOM
      </h2>
      <div className="mt-3 flex flex-col items-center rounded-lg border-2 border-dashed border-border bg-input py-6 text-sm text-muted-foreground">
        <Upload className="mb-2 size-5 text-subtle" />
        Thả ba tệp do <code className="mx-1 font-mono text-xs text-foreground">export_report.py</code> sinh ra vào đây
      </div>
      <ul className="mt-3 divide-y">
        {FILES.map((f) => (
          <li key={f.name} className="flex items-center gap-2 py-2 text-[13px]">
            <f.icon className="size-4 text-subtle" />
            <span className="font-mono text-xs">{f.name}</span>
            <span className="ml-auto w-24 text-xs text-muted-foreground">{f.detail}</span>
            <ToneBadge tone="decided" solid>
              <Check /> Đọc được
            </ToneBadge>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="run-name">Tên lượt chạy</Label>
          <Input id="run-name" defaultValue="MAIN" />
        </div>
        <div className="grid gap-1.5">
          <Label>Trạng thái</Label>
          <SegmentedControl
            aria-label="Trạng thái lượt chạy"
            value={validity}
            onChange={setValidity}
            options={VALIDITY_OPTIONS}
            className="grid grid-cols-3 gap-1 p-1 text-[13px]"
            itemClassName="py-1 text-center"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button>
          <Check /> Nhập vào workspace
        </Button>
      </div>
    </section>
  );
}
