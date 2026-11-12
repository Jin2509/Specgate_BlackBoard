// Server action của kênh chung: gửi tin (kèm highlight) và đưa highlight lên bảng.
"use server";

import { revalidatePath } from "next/cache";
import { postChannelMessage, promoteHighlight } from "@/lib/mock/mutations";
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
    highlightIds: formData.getAll("highlightId").map(String),
  });
  if (!result.ok) return result.error === "empty" ? {} : { error: "Không gửi được tin nhắn, thử lại sau." };
  revalidatePath("/", "layout");
  return { sentAt: Date.now() };
}

export async function moveHighlightToBoard(formData: FormData) {
  const { user } = await requireSession();
  promoteHighlight(String(formData.get("workspaceId") ?? ""), String(formData.get("highlightId") ?? ""), user.id);
  revalidatePath("/", "layout");
}
