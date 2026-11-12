// Server action của kênh chung: gửi tin, highlight một đoạn trong tin của người khác, đặt vai trong nhóm.
"use server";

import { revalidatePath } from "next/cache";
import { addHighlight, postChannelMessage, setTeamRole } from "@/lib/mock/mutations";
import type { HighlightLabel } from "@/lib/types";
import { requireSession } from "./session";

export interface PostState {
  error?: string;
  sentAt?: number;
}

export async function postMessage(_prev: PostState, formData: FormData): Promise<PostState> {
  const { user } = await requireSession();
  const result = postChannelMessage({
    workspaceId: String(formData.get("workspaceId") ?? ""),
    channelId: String(formData.get("channelId") ?? ""),
    userId: user.id,
    text: String(formData.get("text") ?? ""),
  });
  if (!result.ok) return result.error === "empty" ? {} : { error: "Không gửi được tin nhắn, thử lại sau." };
  revalidatePath("/", "layout");
  return { sentAt: Date.now() };
}

const HIGHLIGHT_ERRORS: Record<string, string> = {
  empty: "Đoạn được chọn đang trống.",
  "own-message": "Tin của bạn và agent của bạn đã tự vào ngữ cảnh, không cần highlight.",
  forbidden: "Bạn không còn là thành viên của workspace này.",
};

export async function saveHighlight(input: {
  workspaceId: string;
  channelId: string;
  messageId: string;
  text: string;
  label: HighlightLabel;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireSession();
  const result = addHighlight({ ...input, userId: user.id });
  revalidatePath("/", "layout");
  return result.ok ? { ok: true } : { ok: false, error: HIGHLIGHT_ERRORS[result.error] ?? "Không lưu được highlight." };
}

export async function updateTeamRole(formData: FormData) {
  const { user } = await requireSession();
  setTeamRole(user.id, String(formData.get("workspaceId") ?? ""), String(formData.get("teamRole") ?? ""));
  revalidatePath("/", "layout");
}
