// Locates a passage inside its source answer and labels it exactly as the backend does (whole, partial or edited).
import { format, t } from "@/lib/i18n";
import type { HighlightSegment } from "@/types/highlight";

const MARKDOWN_LINE_PREFIX = /(^|\n)\s*(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/g;
const MARKDOWN_INLINE_MARK = /[*_`~|]+/g;
const SENTENCE_END = ".!?…:;";
const ELLIPSIS = "…";

export function normalizeWhitespace(text: string): string {
  return text.split(/\s+/).filter(Boolean).join(" ");
}

function toPlainText(text: string): string {
  return normalizeWhitespace(
    text.replace(MARKDOWN_LINE_PREFIX, (_match, lineStart: string) => lineStart || " ").replace(MARKDOWN_INLINE_MARK, " "),
  );
}

/** Text as rendered on screen: each whitespace run becomes a newline when it holds one, otherwise a space. */
function toScreenText(text: string): string {
  return text
    .replace(MARKDOWN_LINE_PREFIX, "$1")
    .replace(MARKDOWN_INLINE_MARK, "")
    .replace(/\s+/g, (run) => (run.includes("\n") ? "\n" : " "))
    .trim();
}

/** Whether the passage is a verbatim, contiguous run of the source, ignoring whitespace and Markdown marks. */
export function hasSameWords(passage: string, source: string): boolean {
  const squeeze = (text: string) => toPlainText(text).replace(/\s+/g, "");
  return normalizeWhitespace(source).includes(normalizeWhitespace(passage)) || squeeze(source).includes(squeeze(passage));
}

export interface Excerpt {
  cutStart: boolean;
  cutEnd: boolean;
  partial: boolean;
}

export function toExcerpt(source: string | null | undefined, text: string): Excerpt {
  if (!source) return { cutStart: false, cutEnd: false, partial: false };
  const screenText = toScreenText(source);
  const singleLine = screenText.replace(/\n/g, " ");
  const needle = normalizeWhitespace(toScreenText(text));
  const start = needle ? singleLine.indexOf(needle) : -1;
  if (start < 0) {
    const isWhole = toPlainText(text) === toPlainText(source);
    return { cutStart: !isWhole, cutEnd: !isWhole, partial: !isWhole };
  }
  const end = start + needle.length;
  const cutStart = start > 0;
  const cutEnd = end < singleLine.length;
  const startsClean = !cutStart || screenText[start - 1] === "\n" || (start >= 2 && SENTENCE_END.includes(screenText[start - 2]));
  const endsClean = !cutEnd || SENTENCE_END.includes(needle.at(-1) ?? "") || screenText[end] === "\n";
  return { cutStart, cutEnd, partial: !(startsClean && endsClean) };
}

export interface PassageStatus extends Excerpt {
  edited: boolean;
}

export function toPassageStatus(source: string | null | undefined, original: string, text: string): PassageStatus {
  const base = source || original;
  if (!hasSameWords(text, base)) return { edited: true, partial: false, cutStart: false, cutEnd: false };
  return { edited: false, ...toExcerpt(base, text) };
}

/** Label the speaker, adding "(partial quote)" or "(edited by …)" when the passage is not a whole verbatim run. */
export function toSpeakerLabel(speaker: string, editor: string, status: Pick<PassageStatus, "edited" | "partial">): string {
  if (status.edited) return format(t.highlight.editedBy, { speaker, editor });
  if (status.partial) return format(t.highlight.partialSuffix, { speaker });
  return speaker;
}

/** Add "…" where the passage was cut from its source. */
export function toEllipsizedText(text: string, cut?: { cutStart?: boolean; cutEnd?: boolean }): string {
  return `${cut?.cutStart ? ELLIPSIS : ""}${text}${cut?.cutEnd ? ELLIPSIS : ""}`;
}

export function toSegmentsText(segments: HighlightSegment[]): string {
  return segments.map((segment) => toEllipsizedText(segment.text, segment)).join(" ");
}

/** List what the agent is told about the passages: cut mid-sentence or retold from a summary. */
export function listSegmentNotices(segments: HighlightSegment[]): string[] {
  const notices = new Set<string>();
  for (const segment of segments) {
    if (segment.partial) notices.add(t.highlight.noticePartial);
    if (segment.relayed) notices.add(t.highlight.noticeRelayed);
  }
  return [...notices];
}
