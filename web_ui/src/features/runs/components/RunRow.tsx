"use client";
// Renders one run in the runs table with its status, and the owner's validity and removal actions.
import { FlaskConical, LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { ToneBadge } from "@/components/ToneBadge";
import { Button } from "@/components/ui/Button";
import { format, t } from "@/lib/i18n";
import type { PaperRun } from "@/types/run";

import { deleteRun, updateRunValidity, type RunOutcome } from "../api/run-actions";

const COLUMN_COUNT = 7;

export type LabelledRun = PaperRun & { createdAtLabel: string };

function RunStatusBadge({ run }: { run: PaperRun }) {
  if (run.status === "running")
    return (
      <ToneBadge tone="discussing">
        <LoaderCircle className="animate-spin" /> {t.runs.running}
      </ToneBadge>
    );
  if (run.status === "failed")
    return (
      <ToneBadge tone="rejected" title={run.error ?? undefined}>
        <TriangleAlert /> {t.runs.failed}
      </ToneBadge>
    );
  if (run.validity === "valid")
    return (
      <ToneBadge tone="decided" isSolid>
        {t.channel.valid}
      </ToneBadge>
    );
  return (
    <ToneBadge tone="rejected" isSolid title={run.invalidReason ?? undefined}>
      <TriangleAlert /> {t.channel.invalid}
    </ToneBadge>
  );
}

function NoticeRow({ className, children }: { className: string; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className={className}>
        {children}
      </td>
    </tr>
  );
}

export function RunRow({
  run,
  isCurrent,
  workspaceId,
  canManage,
}: {
  run: LabelledRun;
  isCurrent: boolean;
  workspaceId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isDone = run.status === "done";

  function runAction(call: () => Promise<RunOutcome<unknown>>) {
    startTransition(async () => {
      const outcome = await call();
      if (!outcome.ok) return setError(outcome.error || t.runs.actionFailed);
      setIsReasonOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <tr className="border-b last:border-0">
        <td className="py-2.5">
          <span className="flex items-center gap-1.5 font-medium">
            <FlaskConical className="size-4 text-data" /> {run.name}
            {run.kind === "trial" ? <ToneBadge tone="neutral">{t.channel.trial}</ToneBadge> : null}
            {isCurrent ? <ToneBadge tone="data">{t.runs.inUse}</ToneBadge> : null}
          </span>
        </td>
        <td className="py-2.5 text-xs text-muted-foreground">
          {run.dataset} · <span className="font-mono">{run.variant ?? "?"}</span>
        </td>
        <td className="tabular py-2.5 text-right">{run.tasks}</td>
        <td className="tabular py-2.5 text-right">{isDone ? run.violations : "…"}</td>
        <td className="py-2.5 pl-6">
          <RunStatusBadge run={run} />
        </td>
        <td className="py-2.5 text-muted-foreground">
          {run.createdBy} · {run.createdAtLabel}
        </td>
        <td className="py-2.5 text-right whitespace-nowrap">
          {isDone ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/w/${workspaceId}/metrics?run=${run.id}`}>{t.common.open}</Link>
            </Button>
          ) : null}
          {canManage && isDone ? (
            run.validity === "valid" ? (
              <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setIsReasonOpen((isOpen) => !isOpen)}>
                {t.runs.markInvalid}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => runAction(() => updateRunValidity({ workspaceId, runId: run.id, validity: "valid" }))}
              >
                {t.runs.markValid}
              </Button>
            )
          ) : null}
          {canManage && run.status !== "running" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t.runs.removeRun}
              disabled={isPending}
              onClick={() => runAction(() => deleteRun(workspaceId, run.id))}
            >
              <Trash2 />
            </Button>
          ) : null}
        </td>
      </tr>
      {run.status === "failed" && run.error ? <NoticeRow className="pb-2 text-xs text-rejected">{run.error}</NoticeRow> : null}
      {run.validity !== "valid" && run.invalidReason ? (
        <NoticeRow className="pb-2 text-xs text-rejected">
          {format(t.runs.invalidReason, { reason: run.invalidReason })}
        </NoticeRow>
      ) : null}
      {isReasonOpen ? (
        <NoticeRow className="pb-3">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(() => updateRunValidity({ workspaceId, runId: run.id, validity: "invalidated", invalidReason: reason }));
            }}
          >
            <input
              autoFocus
              aria-label={t.runs.invalidReasonAria}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t.runs.invalidReasonPlaceholder}
              className="h-8 flex-1 rounded-md border border-border bg-input px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button size="sm" type="submit" disabled={isPending || !reason.trim()}>
              {t.common.save}
            </Button>
          </form>
        </NoticeRow>
      ) : null}
      {error ? <NoticeRow className="pb-2 text-xs text-destructive">{error}</NoticeRow> : null}
    </>
  );
}
