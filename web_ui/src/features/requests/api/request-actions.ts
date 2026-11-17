"use server";
// Approves or declines a join request on behalf of the workspace owner.
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/server";
import { callApi } from "@/lib/api/server-api";

export async function updateJoinRequest(formData: FormData): Promise<void> {
  await requireSession();
  const status = formData.get("decision") === "approve" ? "approved" : "rejected";
  const requestId = encodeURIComponent(String(formData.get("requestId") ?? ""));
  // A request someone else already handled cannot be decided twice; the refreshed list shows its outcome.
  await callApi(`/join-requests/${requestId}`, { method: "PATCH", body: { status } }).catch(() => undefined);
  revalidatePath("/", "layout");
}
