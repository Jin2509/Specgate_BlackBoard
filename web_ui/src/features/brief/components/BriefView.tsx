// Renders the summary the backend builds from the idea board, or an empty state until the owner builds one.
import { Check, FileText, FlaskConical, MessagesSquare, StickyNote, X } from "lucide-react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { format, t } from "@/lib/i18n";
import type { Brief } from "@/types/board";
import { cn } from "@/utils/cn";
import { toContentWidthClassName } from "@/utils/content-width";

import { BriefActions } from "./BriefActions";
import { BriefRow } from "./BriefRow";
import { BriefSection } from "./BriefSection";
import { toLowerFirst } from "../utils/lower-first";

export function BriefView({
  workspaceId,
  workspaceName,
  brief,
  meta,
  canRebuild,
}: {
  workspaceId: string;
  workspaceName: string;
  brief: Brief | null;
  meta: string;
  canRebuild: boolean;
}) {
  return (
    <PageLayout>
      <PageHeader
        icon={<FileText />}
        title={t.brief.pageTitle}
        meta={t.brief.pageMeta}
        actions={<BriefActions workspaceId={workspaceId} markdown={brief?.markdown ?? null} canRebuild={canRebuild} />}
      />
      <PageBody>
        {brief ? (
          <BriefArticle brief={brief} meta={meta} />
        ) : (
          <div className="mx-auto max-w-xl rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <FileText className="mx-auto size-8 text-subtle" />
            <h2 className="mt-3 text-lg font-semibold text-sidebar-accent-foreground">
              {format(t.brief.emptyTitle, { name: workspaceName })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{canRebuild ? t.brief.emptyOwner : t.brief.emptyMember}</p>
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}

function BriefArticle({ brief, meta }: { brief: Brief; meta: string }) {
  return (
    <article className={cn(toContentWidthClassName("wide"), "rounded-lg bg-card px-6 py-6 md:px-10 md:py-8")}>
      <p className="text-[13px] font-semibold text-subtle">{t.brief.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold text-sidebar-accent-foreground">{brief.title}</h2>
      <p className="mt-1 text-xs text-subtle">{meta}</p>
      <p className="mt-3 text-sm text-muted-foreground">{format(t.brief.briefLine, { brief: brief.brief })}</p>

      <div className="mt-6 grid gap-x-12 gap-y-6 border-t border-border pt-6 @3xl:grid-cols-2">
        <div className="space-y-6">
          <BriefSection icon={<Check />} title={t.brief.decided} toneClassName="text-decided">
            {brief.decided.map((idea) => (
              <BriefRow key={idea.number} title={`#${idea.number} ${idea.body}`} isStrong>
                {format(t.brief.because, { reason: toLowerFirst(idea.reason) })}{" "}
                {idea.deciderName ? format(t.brief.decidedBy, { name: idea.deciderName }) : ""}
              </BriefRow>
            ))}
            {brief.decided.length === 0 ? <p className="text-[13px] text-subtle">{t.brief.noneDecided}</p> : null}
          </BriefSection>
          <BriefSection icon={<X />} title={t.brief.rejected} toneClassName="text-rejected">
            {brief.rejected.map((idea) => (
              <BriefRow key={idea.number} title={`#${idea.number} ${idea.body}`}>
                {format(t.brief.becauseNoPeriod, { reason: toLowerFirst(idea.reason) })}
              </BriefRow>
            ))}
            {brief.rejected.length === 0 ? <p className="text-[13px] text-subtle">{t.brief.noneRejected}</p> : null}
          </BriefSection>
        </div>
        <div className="space-y-6">
          <BriefSection icon={<MessagesSquare />} title={t.brief.discussing} toneClassName="text-discussing">
            {brief.discussing.map((idea) => (
              <BriefRow key={idea.number} title={`#${idea.number} ${idea.body}`}>
                {format(t.brief.raisedBy, { name: idea.authorName })}
              </BriefRow>
            ))}
            {brief.discussing.length === 0 ? <p className="text-[13px] text-subtle">{t.brief.noneDiscussing}</p> : null}
          </BriefSection>
          <BriefSection icon={<StickyNote />} title={t.brief.notes} toneClassName="text-muted-foreground">
            <p className="text-[13px] text-muted-foreground">
              {brief.notes.length ? brief.notes.map((note) => note.body).join(" ") : t.brief.noNotes}
            </p>
          </BriefSection>
          {brief.evidence ? <EvidenceSection evidence={brief.evidence} /> : null}
        </div>
      </div>
    </article>
  );
}

function EvidenceSection({ evidence }: { evidence: NonNullable<Brief["evidence"]> }) {
  const isValid = evidence.run.validity === "valid";
  const title = format(t.brief.evidenceRun, {
    name: evidence.run.name,
    dataset: evidence.run.dataset,
    tasks: evidence.run.tasks,
    trial: evidence.run.kind === "trial" ? t.brief.trialSuffix : "",
    validity: isValid ? t.channel.valid : t.channel.invalid,
  });
  return (
    <BriefSection icon={<FlaskConical />} title={t.brief.evidence} toneClassName="text-data">
      <BriefRow title={title} isStrong>
        {!isValid ? (
          <p className="text-xs text-rejected">{format(t.brief.doNotConclude, { reason: evidence.run.invalidReason ?? "" })}</p>
        ) : null}
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {evidence.criteria.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </BriefRow>
    </BriefSection>
  );
}
