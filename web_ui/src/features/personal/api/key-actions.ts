"use server";
// Saves, switches the model of and forgets the personal agent's API key; the backend checks a key before storing it.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMe } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { ProviderKey } from "@/types/agent";
import { toPersonalHomePath } from "@/utils/route-paths";

export interface KeyFormState {
  error?: string;
}

const KEY_PATH = "/me/key";

export async function updateKey(_previous: KeyFormState, formData: FormData): Promise<KeyFormState> {
  const me = await requireMe();
  try {
    await callApi<{ key: ProviderKey }>(KEY_PATH, {
      method: "PUT",
      body: {
        provider: formData.get("provider") === "openai-compatible" ? "openai-compatible" : "anthropic",
        apiKey: String(formData.get("apiKey") ?? ""),
        baseUrl: String(formData.get("baseUrl") ?? "") || null,
      },
    });
  } catch (error) {
    return { error: toErrorMessage(error, t.personal.keySaveFailed) };
  }
  revalidatePath("/", "layout");
  redirect(toPersonalHomePath(me.personalWorkspaceId));
}

export async function updateModel(formData: FormData): Promise<void> {
  await requireMe();
  await callApi(KEY_PATH, { method: "PATCH", body: { model: String(formData.get("model") ?? "") } }).catch(() => undefined);
  revalidatePath("/", "layout");
}

export async function deleteKey(): Promise<void> {
  const me = await requireMe();
  await callApi(KEY_PATH, { method: "DELETE" });
  revalidatePath("/", "layout");
  redirect(`${toPersonalHomePath(me.personalWorkspaceId)}/key`);
}
