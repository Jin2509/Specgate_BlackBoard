// Runs a personal workspace action for the signed-in user and turns backend errors into a typed outcome.
import { revalidatePath } from "next/cache";

import { requireMe } from "@/features/auth/server";
import { isApiError, toErrorMessage } from "@/lib/api/http-client";

export type PersonalOutcome<T = unknown> = { ok: true; value: T } | { ok: false; error: string; code?: string };

export async function runPersonalAction<T>(fallbackMessage: string, call: () => Promise<T>): Promise<PersonalOutcome<T>> {
  await requireMe();
  try {
    const value = await call();
    revalidatePath("/", "layout");
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, fallbackMessage), code: isApiError(error) ? error.code : undefined };
  }
}
