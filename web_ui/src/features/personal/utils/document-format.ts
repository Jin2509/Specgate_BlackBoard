// Formats the token counts shown next to answers.
import { format, locale, t } from "@/lib/i18n";
import type { TurnUsage } from "@/types/conversation";

function toNumberLabel(count: number): string {
  return count.toLocaleString(locale);
}

/** Input, cached and output tokens of one answer. */
export function toUsageLabel(usage: TurnUsage): string {
  return format(t.personal.usage, {
    input: toNumberLabel(usage.inputTokens),
    cached: toNumberLabel(usage.cachedInputTokens),
    output: toNumberLabel(usage.outputTokens ?? 0),
  });
}
