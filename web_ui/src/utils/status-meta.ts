// Maps idea statuses, highlight labels, verdicts and run validity to their display label and tone.
import { t } from "@/lib/i18n";
import type { IdeaStatus } from "@/types/board";
import type { HighlightLabel } from "@/types/highlight";
import type { Validity, Verdict } from "@/types/run";

import type { Tone } from "./tone";

/** Idea statuses carry no colour: the column and the wording tell them apart. */
export const IDEA_STATUS_META: Record<IdeaStatus, { label: string; tone: Tone; verb: string }> = {
  proposed: { label: t.status.proposed, tone: "neutral", verb: t.status.verbProposed },
  discussing: { label: t.status.discussing, tone: "neutral", verb: t.status.verbProposed },
  decided: { label: t.status.decided, tone: "neutral", verb: t.status.verbDecided },
  rejected: { label: t.status.rejected, tone: "neutral", verb: t.status.verbRejected },
};

export const IDEA_COLUMNS: readonly IdeaStatus[] = ["proposed", "discussing", "decided", "rejected"];

export const HIGHLIGHT_LABEL_META: Record<HighlightLabel, { label: string }> = {
  important: { label: t.status.important },
  review: { label: t.status.review },
};

export const VERDICT_META: Record<Verdict, { label: string; tone: Tone }> = {
  PASS: { label: t.status.pass, tone: "decided" },
  FAIL: { label: t.status.fail, tone: "rejected" },
  INSUFFICIENT_DATA: { label: t.status.insufficient, tone: "insufficient" },
  NOT_SET: { label: t.status.notSet, tone: "neutral" },
};

export const VALIDITY_META: Record<Validity, { label: string; tone: Tone }> = {
  valid: { label: t.status.valid, tone: "decided" },
  invalidated: { label: t.status.invalidated, tone: "rejected" },
};
