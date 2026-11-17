// Builds the /decide command equivalent to a decision made in the dialog.
import { t } from "@/lib/i18n";
import type { Decision } from "@/types/board";

const REASON_PREVIEW_LENGTH = 28;

export function toDecideCommand(number: number, decision: Decision, reason: string): string {
  const trimmedReason = reason.trim();
  const preview =
    trimmedReason.length > REASON_PREVIEW_LENGTH ? `${trimmedReason.slice(0, REASON_PREVIEW_LENGTH).trimEnd()}…` : trimmedReason;
  const verb = decision === "decided" ? t.board.commandDecide : t.board.commandReject;
  return `/decide #${number} ${verb} ${preview}`.trim();
}
