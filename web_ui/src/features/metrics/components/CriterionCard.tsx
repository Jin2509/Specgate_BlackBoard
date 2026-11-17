// Renders one criterion: value, confidence interval, threshold and verdict.
import { Check, MessageSquare } from "lucide-react";
import Link from "next/link";

import { ToneBadge } from "@/components/ToneBadge";
import { format, t } from "@/lib/i18n";
import type { Criterion } from "@/types/run";
import { cn } from "@/utils/cn";
import { toChannelPath, DEFAULT_CHANNEL } from "@/utils/route-paths";
import { VERDICT_META } from "@/utils/status-meta";
import { TONE_CLASSES } from "@/utils/tone";

const CI_MIN_WIDTH_PX = 4;

function toPercent(fraction: number): string {
  return `${Math.max(0, Math.min(1, fraction)) * 100}%`;
}

export function CriterionCard({
  criterion,
  workspaceId,
  decidedIdeaCount = 0,
}: {
  criterion: Criterion;
  workspaceId: string;
  decidedIdeaCount?: number;
}) {
  const meta = VERDICT_META[criterion.verdict];
  const tone = TONE_CLASSES[meta.tone];

  return (
    <section id={`criterion-${criterion.number}`} className="flex flex-col rounded-lg bg-card p-4">
      <header className="flex items-start gap-2">
        <span className="font-mono text-xs text-subtle">{criterion.number}</span>
        <h3 className="text-[13px] leading-snug font-medium">{criterion.title}</h3>
        <ToneBadge tone={meta.tone} isSolid className="ml-auto">
          {meta.label}
        </ToneBadge>
      </header>

      <p className="mt-4 flex items-baseline gap-2">
        <span className="tabular text-4xl font-light tracking-tight">{criterion.display}</span>
        <span className="tabular text-xs text-muted-foreground">
          {criterion.numerator != null ? `${criterion.numerator} / ${criterion.denominator} · ` : ""}
          {criterion.tasks === null ? t.metrics.taskCountUnknown : format(t.metrics.taskCount, { count: criterion.tasks })}
        </span>
      </p>

      <div className="relative mt-5 mb-1 h-2" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        {criterion.ciLow != null && criterion.ciHigh != null ? (
          <div
            className={cn("absolute top-0 h-2 rounded-full opacity-35", tone.bar)}
            style={{
              left: toPercent(criterion.ciLow),
              width: `calc(${toPercent(criterion.ciHigh)} - ${toPercent(criterion.ciLow)})`,
              minWidth: CI_MIN_WIDTH_PX,
            }}
          />
        ) : null}
        {criterion.value !== null ? (
          <div className={cn("absolute -top-1 h-4 w-0.75 rounded-full", tone.bar)} style={{ left: toPercent(criterion.value) }} />
        ) : null}
        {criterion.threshold ? (
          <div
            className="absolute -top-1.5 h-5 border-l border-dashed border-foreground/50"
            style={{ left: toPercent(criterion.threshold.value) }}
          />
        ) : null}
      </div>

      <footer className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground">
        <span>{criterion.footnote}</span>
        <span className="ml-auto flex items-center gap-2">
          {decidedIdeaCount > 0 ? (
            <Link
              href={`/w/${workspaceId}/board`}
              className="inline-flex items-center gap-1 font-medium text-decided hover:underline"
            >
              <Check className="size-3" /> {format(t.metrics.decidedIdeas, { count: decidedIdeaCount })}
            </Link>
          ) : null}
          <Link
            href={toChannelPath(workspaceId, DEFAULT_CHANNEL)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-primary-strong hover:bg-hover"
          >
            <MessageSquare className="size-3" /> {t.metrics.discuss}
          </Link>
        </span>
      </footer>
    </section>
  );
}
