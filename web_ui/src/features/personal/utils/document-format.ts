// Formats file sizes and token counts shown next to attached files and answers.
import { format, locale, t } from "@/lib/i18n";
import type { TurnUsage } from "@/types/conversation";

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;

function toNumberLabel(count: number): string {
  return count.toLocaleString(locale);
}

/** "820 KB", "2.4 MB": rounded for a glance, not exact. */
export function toFileSizeLabel(sizeBytes: number): string {
  if (sizeBytes >= BYTES_PER_MEGABYTE)
    return `${(sizeBytes / BYTES_PER_MEGABYTE).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(sizeBytes / BYTES_PER_KILOBYTE)).toLocaleString(locale)} KB`;
}

/** Input, cached and output tokens of one answer. */
export function toUsageLabel(usage: TurnUsage): string {
  return format(t.personal.usage, {
    input: toNumberLabel(usage.inputTokens),
    cached: toNumberLabel(usage.cachedInputTokens),
    output: toNumberLabel(usage.outputTokens ?? 0),
  });
}
