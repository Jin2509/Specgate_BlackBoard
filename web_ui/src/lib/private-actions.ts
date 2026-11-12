// Server action của workspace riêng: lưu key, chọn mô hình, hội thoại, gắn ngữ cảnh nhóm, gửi câu trả lời vào kênh.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  chooseModel,
  deleteConversation,
  linkConversation,
  postAgentReply,
  removeHighlight,
  removeProviderKey,
  saveProviderKey,
  sendTurn,
} from "@/lib/mock/mutations";
import { getPersonalWorkspace } from "@/lib/mock/queries";
import type { ProviderKind } from "@/lib/types";
import { personalHome } from "./paths";
import { requireSession } from "./session";

export interface KeyFormState {
  error?: string;
}

const KEY_ERRORS: Record<string, string> = {
  "invalid-key": "Nhà cung cấp từ chối key này. Kiểm tra lại key, hoặc tạo key mới ở trang dành cho nhà phát triển.",
  quota: "Key hợp lệ nhưng đã hết hạn mức. Nạp thêm tiền ở nhà cung cấp hoặc dùng key khác.",
};

async function base() {
  const { user } = await requireSession();
  return { user, home: personalHome(getPersonalWorkspace(user.id)?.id) };
}

export async function saveKey(_prev: KeyFormState, formData: FormData): Promise<KeyFormState> {
  const { user, home } = await base();
  const provider = (formData.get("provider") === "openai-compatible" ? "openai-compatible" : "anthropic") as ProviderKind;
  const result = saveProviderKey({
    userId: user.id,
    provider,
    apiKey: String(formData.get("apiKey") ?? ""),
    baseUrl: String(formData.get("baseUrl") ?? ""),
  });
  if (!result.ok) return { error: KEY_ERRORS[result.error] ?? "Không lưu được key, thử lại sau." };
  revalidatePath("/", "layout");
  redirect(home);
}

export async function pickModel(formData: FormData) {
  const { user } = await base();
  chooseModel(user.id, String(formData.get("model") ?? ""));
  revalidatePath("/", "layout");
}

export async function forgetKey() {
  const { user, home } = await base();
  removeProviderKey(user.id);
  revalidatePath("/", "layout");
  redirect(`${home}/key`);
}

export interface TurnFormState {
  error?: string;
}

export async function askAgent(_prev: TurnFormState, formData: FormData): Promise<TurnFormState> {
  const { user, home } = await base();
  const conversationId = String(formData.get("conversationId") ?? "") || undefined;
  const workspaceId = String(formData.get("workspaceId") ?? "") || undefined;
  const result = sendTurn(user.id, conversationId, String(formData.get("text") ?? ""), workspaceId);
  if (!result.ok) {
    if (result.error === "no-key") redirect(`${home}/key`);
    if (result.error === "empty") return {};
    return { error: "Không gửi được câu hỏi, thử lại sau." };
  }
  revalidatePath("/", "layout");
  if (!conversationId) redirect(`${home}/${result.value.id}`);
  return {};
}

export async function removeConversation(formData: FormData) {
  const { user, home } = await base();
  deleteConversation(user.id, String(formData.get("conversationId") ?? ""));
  revalidatePath("/", "layout");
  redirect(home);
}

// Gắn hội thoại với một workspace chung, hoặc bỏ gắn khi chọn "Không".
export async function linkWorkspace(formData: FormData) {
  const { user } = await base();
  linkConversation(user.id, String(formData.get("conversationId") ?? ""), String(formData.get("workspaceId") ?? "") || undefined);
  revalidatePath("/", "layout");
}

const POST_ERRORS: Record<string, string> = {
  empty: "Đoạn gửi đang trống.",
  "not-linked": "Hội thoại chưa gắn workspace chung nào.",
  forbidden: "Bạn không còn là thành viên của workspace chung này.",
};

export async function sendReplyToChannel(input: {
  conversationId: string;
  turnId: string;
  channelId: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await base();
  const result = postAgentReply({ ...input, userId: user.id });
  revalidatePath("/", "layout");
  return result.ok ? { ok: true } : { ok: false, error: POST_ERRORS[result.error] ?? "Không gửi được vào kênh, thử lại sau." };
}

export async function deleteHighlight(formData: FormData) {
  const { user } = await base();
  removeHighlight(user.id, String(formData.get("highlightId") ?? ""));
  revalidatePath("/", "layout");
}
