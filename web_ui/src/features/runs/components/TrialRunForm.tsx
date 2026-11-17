"use client";
// Starts a small trial run on the server's ADOM setup and follows its progress live, one run per workspace at a time.
import { Check, LoaderCircle, Play, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { PaperRun, TrialLevel } from "@/types/run";

import { createTrialRun, getRunProgress } from "../api/run-actions";

const POLL_INTERVAL_MS = 1500;
const DEFAULT_TASKS = "HumanEval/1, HumanEval/13, HumanEval/38";
const TASK_SEPARATOR = /[\s,;]+/;

const STEP_LABELS: Record<string, string> = {
  queued: t.runs.stepQueued,
  setup: t.runs.stepSetup,
  admit: t.runs.stepAdmit,
  run: t.runs.stepRun,
  done: t.runs.stepDone,
  failed: t.runs.stepFailed,
};

export function TrialRunForm({
  workspaceId,
  runningRun,
  maxTaskCount,
  mode,
}: {
  workspaceId: string;
  runningRun: PaperRun | null;
  maxTaskCount: number;
  mode: "fake" | "pipeline";
}) {
  const router = useRouter();
  const [tasksText, setTasksText] = useState(DEFAULT_TASKS);
  const [level, setLevel] = useState<TrialLevel>("A3");
  const [error, setError] = useState<string | null>(null);
  const [liveRun, setLiveRun] = useState<PaperRun | null>(runningRun);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!liveRun || liveRun.status !== "running") return;
    const timer = window.setInterval(async () => {
      const outcome = await getRunProgress(workspaceId, liveRun.id);
      if (!outcome.ok) return;
      setLiveRun(outcome.value);
      if (outcome.value.status !== "running") router.refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [liveRun, workspaceId, router]);

  const taskIds = tasksText.split(TASK_SEPARATOR).filter(Boolean);
  const progress = liveRun?.progress;
  const doneTasks = progress?.done ?? [];

  function handleStart() {
    startTransition(async () => {
      setError(null);
      const outcome = await createTrialRun(workspaceId, taskIds, level);
      if (!outcome.ok) return setError(outcome.error);
      setLiveRun(outcome.value);
      router.refresh();
    });
  }

  return (
    <section className="min-w-0 rounded-lg bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Play className="size-4 text-subtle" /> {t.runs.trialTitle}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        {format(t.runs.trialLead, { max: maxTaskCount })}
        {mode === "fake" ? t.runs.trialFakeMode : ""}
      </p>

      {liveRun && liveRun.status === "running" ? (
        <div className="mt-3 rounded-md bg-muted p-3 text-[13px]">
          <p className="flex items-center gap-2 font-medium">
            <LoaderCircle className="size-4 animate-spin text-discussing" /> {liveRun.name}:{" "}
            {STEP_LABELS[progress?.step ?? "queued"] ?? progress?.step}
            {progress?.current ? <span className="font-mono text-xs text-subtle">{progress.current}</span> : null}
          </p>
          <ul className="mt-2 space-y-0.5">
            {(liveRun.config.taskIds ?? []).map((taskId) => {
              const doneTask = doneTasks.find((task) => task.taskId === taskId);
              return (
                <li key={taskId} className="flex items-center gap-2 text-xs">
                  {doneTask ? <Check className="size-3.5 text-decided" /> : <span className="size-3.5" />}
                  <span className="font-mono">{taskId}</span>
                  {doneTask ? (
                    <span className="text-subtle">{format(t.runs.taskViolations, { count: doneTask.violations })}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-subtle">{t.runs.trialKeepsRunning}</p>
        </div>
      ) : (
        <>
          {liveRun && liveRun.status === "failed" ? (
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-rejected">
              <TriangleAlert className="size-4" /> {format(t.runs.trialError, { run: liveRun.name, error: liveRun.error ?? "" })}
            </p>
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="grid gap-1.5">
              <Label htmlFor="trial-tasks">{t.runs.trialTasks}</Label>
              <Input id="trial-tasks" value={tasksText} onChange={(event) => setTasksText(event.target.value)} />
              <p className="text-xs text-subtle">
                {format(t.runs.trialTaskCount, { count: taskIds.length })}
                {taskIds.length > maxTaskCount ? format(t.runs.trialOverLimit, { max: maxTaskCount }) : ""}
              </p>
            </div>
            <div className="grid content-start gap-1.5">
              <Label htmlFor="trial-level">{t.runs.trialLevel}</Label>
              <Select
                id="trial-level"
                aria-label={t.runs.trialLevel}
                size="lg"
                value={level}
                onValueChange={setLevel}
                className="w-full"
                options={[
                  { value: "A3", label: t.runs.levelA3 },
                  { value: "A1", label: "A1" },
                ]}
              />
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="mt-3 flex justify-end">
            <Button disabled={isPending || taskIds.length === 0 || taskIds.length > maxTaskCount} onClick={handleStart}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Play />} {t.runs.startTrial}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
