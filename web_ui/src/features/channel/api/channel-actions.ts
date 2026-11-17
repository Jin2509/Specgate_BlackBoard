"use server";
// Posts channel messages, saves highlights of other people's passages for the viewer's agent and records read position.
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/server";
import { isApiError, toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { HighlightLabel } from "@/types/highlight";
import type { Message } from "@/types/message";

/**
 * `code` asks the composer to confirm and resend: ALREADY_SENT (highlight already in this channel), OTHER_CONTEXT
 * (written while the agent read another team) or PIN_CHOICE (the pinned message has both words and cards).
 */
export interface MessageFormState {
  error?: string;
  code?: string;
  sentAt?: number;
}

export type HighlightOutcome = { ok: true; skippedCount: number } | { ok: false; error: string };

function toChannelPath(workspaceId: string, channelId: string): string {
  return `/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}`;
}

function toOptionalField(formData: FormData, name: string): string | null {
  return String(formData.get(name) ?? "") || null;
}

export async function createMessage(_previous: MessageFormState, formData: FormData): Promise<MessageFormState> {
  await requireSession();
  const text = String(formData.get("text") ?? "");
  const quoteIds = formData.getAll("quoteId").map(String).filter(Boolean);
  if (!text.trim() && quoteIds.length === 0) return {};
  const path = toChannelPath(String(formData.get("workspaceId")), String(formData.get("channelId")));
  try {
    await callApi<{ messages: Message[] }>(`${path}/messages`, {
      method: "POST",
      body: {
        text,
        quoteIds,
        confirm: formData.get("confirm") === "1",
        confirmContext: formData.get("confirmContext") === "1",
        pinPart: toOptionalField(formData, "pinPart"),
        replyToId: toOptionalField(formData, "replyToId"),
      },
    });
  } catch (error) {
    return { error: toErrorMessage(error, t.channel.sendFailed), code: isApiError(error) ? error.code : undefined };
  }
  revalidatePath("/", "layout");
  return { sentAt: Date.now() };
}

/** Save one or more passages, each with its speaker; the viewer's own messages are skipped and counted. */
export async function createHighlight(input: {
  workspaceId: string;
  channelId: string;
  segments: Array<{ messageId: string; text: string; part: number | null; turn?: number | null }>;
  label: HighlightLabel;
  note?: string;
}): Promise<HighlightOutcome> {
  await requireSession();
  try {
    const created = await callApi<{ skippedMessageIds: string[] }>(
      `${toChannelPath(input.workspaceId, input.channelId)}/highlights`,
      { method: "POST", body: { segments: input.segments, label: input.label, note: input.note || null } },
    );
    revalidatePath("/", "layout");
    return { ok: true, skippedCount: created.skippedMessageIds.length };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.channel.highlightFailed) };
  }
}

/** Record that the open channel has been read up to this message, which clears its unread dot. */
export async function updateReadPosition(workspaceId: string, channelId: string, seq: number): Promise<void> {
  await requireSession();
  await callApi(`${toChannelPath(workspaceId, channelId)}/read`, { method: "PUT", body: { seq } }).catch(() => undefined);
}
