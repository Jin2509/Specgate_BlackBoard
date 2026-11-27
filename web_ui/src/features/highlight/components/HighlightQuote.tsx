// Renders one highlight for the agent: chalk-marked passage, label, speaker, notices and the viewer's private note.
import type { ReactNode } from "react";

import { t } from "@/lib/i18n";
import type { HighlightLabel } from "@/types/highlight";
import { cn } from "@/utils/cn";
import { HIGHLIGHT_LABEL_META } from "@/utils/status-meta";

export function HighlightQuote({
  text,
  label,
  byline,
  actions,
  note,
  notices = [],
  className,
}: {
  text: string;
  label: HighlightLabel;
  byline: ReactNode;
  actions?: ReactNode;
  /** "My note", kept apart from the speaker's words. */
  note?: string | null;
  /** What the agent is told about the passage: cut mid-sentence, retold, or from an unusable run. */
  notices?: string[];
  className?: string;
}) {
  return (
    <figure className={cn("max-w-xl rounded-r-md border-l-[3px] border-mark-line bg-card py-2 pr-3 pl-3", className)}>
      <blockquote className="text-[0.90625rem] leading-relaxed text-foreground">
        <span className="chalk-mark box-decoration-clone">{text}</span>
      </blockquote>
      <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
        <span className="rounded-sm bg-primary-soft px-1.5 py-px font-medium text-primary-strong">
          {HIGHLIGHT_LABEL_META[label].label}
        </span>
        <span>{t.highlight.notDecision}</span>
        <span aria-hidden>/</span>
        <span>{byline}</span>
        {actions ? <span className="ml-auto flex items-center gap-1">{actions}</span> : null}
      </figcaption>
      {notices.length ? (
        <ul className="mt-1.5 space-y-0.5 text-xs text-proposed">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}
      {note ? (
        <p className="mt-1.5 border-t border-border pt-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{t.highlight.myNotePrefix}</span> {note}
        </p>
      ) : null}
    </figure>
  );
}
