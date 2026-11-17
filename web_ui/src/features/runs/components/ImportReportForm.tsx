"use client";
// Imports a run from the three files ADOM's export_report.py writes, or one specgate-run/1 JSON report.
import { Check, FileJson, FileSpreadsheet, FileUp, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/SegmentedControl";
import { ToneBadge } from "@/components/ToneBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { format, t } from "@/lib/i18n";
import type { Validity } from "@/types/run";

import { createImportedRun, type RunReport } from "../api/run-actions";

type FileSlot = "summary" | "perTask" | "meta" | "native";

const ADOM_SLOTS: readonly FileSlot[] = ["summary", "perTask", "meta"];

const SLOT_LABELS: Record<FileSlot, string> = {
  summary: "<RUN>_summary.csv",
  perTask: "<RUN>_per_task.csv",
  meta: "<RUN>_run_meta.json",
  native: t.runs.nativeReport,
};

function toFileSlot(fileName: string): FileSlot | null {
  const name = fileName.toLowerCase();
  if (name.endsWith("_summary.csv") || name === "summary.csv") return "summary";
  if (name.endsWith("_per_task.csv") || name === "per_task.csv") return "perTask";
  if (name.endsWith("_run_meta.json") || name === "run_meta.json") return "meta";
  if (name.endsWith(".json")) return "native";
  return null;
}

type ChosenFiles = Partial<Record<FileSlot, { name: string; text: string }>>;

function toRunReport(files: ChosenFiles): RunReport | null {
  if (files.summary && files.perTask && files.meta) {
    return { format: "adom-export", summaryCsv: files.summary.text, perTaskCsv: files.perTask.text, runMeta: files.meta.text };
  }
  return files.native ? { format: "specgate-run/1", report: files.native.text } : null;
}

export function ImportReportForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<ChosenFiles>({});
  const [unknownFileNames, setUnknownFileNames] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [validity, setValidity] = useState<Validity>("valid");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const report = toRunReport(files);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = { ...files };
    const unknown: string[] = [];
    for (const file of Array.from(fileList)) {
      const slot = toFileSlot(file.name);
      if (!slot) unknown.push(file.name);
      else next[slot] = { name: file.name, text: await file.text() };
    }
    setFiles(next);
    setUnknownFileNames(unknown);
    setError(null);
  }

  function handleSubmit() {
    if (!report) return;
    startTransition(async () => {
      const outcome = await createImportedRun({
        workspaceId,
        report,
        name: name.trim() || undefined,
        validity,
        invalidReason: reason,
      });
      if (!outcome.ok) return setError(outcome.error);
      router.push(`/w/${workspaceId}/metrics?run=${outcome.value.id}`);
    });
  }

  const shownSlots = files.native ? [...ADOM_SLOTS, "native" as const] : ADOM_SLOTS;

  return (
    <section className="min-w-0 rounded-lg bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <FileUp className="size-4 text-subtle" /> {t.runs.importTitle}
      </h2>
      <label className="mt-3 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-border bg-input py-6 text-center text-sm text-muted-foreground hover:border-primary/50">
        <Upload className="mb-2 size-5 text-subtle" />
        <span>
          {t.runs.dropFilesBefore} <code className="mx-1 font-mono text-xs text-foreground">export_report.py</code>{" "}
          {t.runs.dropFilesAfter}
        </span>
        <input
          type="file"
          multiple
          accept=".csv,.json"
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </label>
      <ul className="mt-3 divide-y">
        {shownSlots.map((slot) => {
          const file = files[slot];
          const Icon = slot === "summary" || slot === "perTask" ? FileSpreadsheet : FileJson;
          return (
            <li key={slot} className="flex items-center gap-2 py-2 text-[13px]">
              <Icon className="size-4 text-subtle" />
              <span className="font-mono text-xs">{file?.name ?? SLOT_LABELS[slot]}</span>
              {file ? (
                <ToneBadge tone="decided" isSolid className="ml-auto">
                  <Check /> {t.runs.fileChosen}
                </ToneBadge>
              ) : (
                <span className="ml-auto text-xs text-subtle">{t.runs.fileMissing}</span>
              )}
            </li>
          );
        })}
      </ul>
      {unknownFileNames.length ? (
        <p className="text-xs text-proposed">{format(t.runs.unknownFiles, { files: unknownFileNames.join(", ") })}</p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="run-name">{t.runs.runName}</Label>
          <Input id="run-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="MAIN" />
        </div>
        <div className="grid gap-1.5">
          <Label>{t.runs.validity}</Label>
          <SegmentedControl
            aria-label={t.runs.validityAria}
            value={validity}
            onChange={setValidity}
            options={[
              { value: "valid", label: t.channel.valid, activeClassName: "text-decided" },
              { value: "invalidated", label: t.channel.invalid, activeClassName: "text-rejected" },
            ]}
            className="grid grid-cols-2 gap-1 p-1 text-[13px]"
            itemClassName="py-1 text-center"
          />
        </div>
      </div>
      {validity === "invalidated" ? (
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor="run-reason">{t.runs.invalidReasonLabel}</Label>
          <Input id="run-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-end gap-3">
        <p className="text-xs text-subtle">{t.runs.importNotice}</p>
        <Button onClick={handleSubmit} disabled={isPending || !report || (validity === "invalidated" && !reason.trim())}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Check />} {t.runs.importButton}
        </Button>
      </div>
    </section>
  );
}
