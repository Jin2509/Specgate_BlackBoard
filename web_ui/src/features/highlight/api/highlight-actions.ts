"use server";
// Updates the label or private note of a highlight for the agent, or deletes it.
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { HighlightLabel } from "@/types/highlight";

export type HighlightActionOutcome = { ok: true } | { ok: false; error: string };

function toHighlightPath(highlightId: string): string {
  return `/highlights/${encodeURIComponent(highlightId)}`;
}

export async function updateHighlight(
  highlightId: string,
  patch: { note?: string; label?: HighlightLabel },
): Promise<HighlightActionOutcome> {
  await requireSession();
  try {
    await callApi(toHighlightPath(highlightId), { method: "PATCH", body: patch });
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.highlight.updateFailed) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteHighlight(formData: FormData): Promise<void> {
  await requireSession();
  await callApi(toHighlightPath(String(formData.get("highlightId") ?? "")), { method: "DELETE" }).catch(() => undefined);
  revalidatePath("/", "layout");
}
