// Thẻ một tiêu chí: giá trị, khoảng tin cậy, ngưỡng, phán quyết.
import Link from "next/link";
import { Check, MessageSquare } from "lucide-react";
import { ToneBadge } from "@/components/common/tone-badge";
import { toneClasses, verdictMeta } from "@/lib/status";
import type { Criterion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CriterionCard({
  c,
  workspaceId,
  decidedIdeas = 0,
}: {
  c: Criterion;
  workspaceId: string;
  decidedIdeas?: number;
}) {
  const meta = verdictMeta[c.verdict];
  const tone = toneClasses[meta.tone];
  const pct = (x: number) => `${Math.max(0, Math.min(1, x)) * 100}%`;

  return (
    <section id={`tieu-chi-${c.number}`} className="flex flex-col rounded-lg bg-card p-4">
      <header className="flex items-start gap-2">
        <span className="font-mono text-xs text-subtle">{c.number}</span>
        <h3 className="text-[13px] leading-snug font-medium">{c.title}</h3>
        <ToneBadge tone={meta.tone} solid className="ml-auto">
          {meta.label}
        </ToneBadge>
      </header>

      <p className="mt-4 flex items-baseline gap-2">
        <span className="tabular text-4xl font-light tracking-tight">{c.display}</span>
        <span className="tabular text-xs text-muted-foreground">
          {c.numerator !== undefined ? `${c.numerator} / ${c.denominator} · ` : ""}
          {c.tasks} tác vụ
        </span>
      </p>

      <div className="relative mt-5 mb-1 h-2" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        {c.ciLow !== undefined && c.ciHigh !== undefined ? (
          <div
            className={cn("absolute top-0 h-2 rounded-full opacity-35", tone.bar)}
            style={{ left: pct(c.ciLow), width: `calc(${pct(c.ciHigh)} - ${pct(c.ciLow)})`, minWidth: 4 }}
          />
        ) : null}
        {c.value !== null ? (
          <div className={cn("absolute -top-1 h-4 w-0.75 rounded-full", tone.bar)} style={{ left: pct(c.value) }} />
        ) : null}
        {c.threshold ? (
          <div
            className="absolute -top-1.5 h-5 border-l border-dashed border-foreground/50"
            style={{ left: pct(c.threshold.value) }}
          />
        ) : null}
      </div>

      <footer className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground">
        <span>{c.footnote}</span>
        <span className="ml-auto flex items-center gap-2">
          {decidedIdeas > 0 ? (
            <Link
              href={`/w/${workspaceId}/board`}
              className="inline-flex items-center gap-1 font-medium text-decided hover:underline"
            >
              <Check className="size-3" /> {decidedIdeas} ý đã chốt
            </Link>
          ) : null}
          <Link
            href={`/w/${workspaceId}/c/chung`}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-primary-strong hover:bg-hover"
          >
            <MessageSquare className="size-3" /> Thảo luận
          </Link>
        </span>
      </footer>
    </section>
  );
}
