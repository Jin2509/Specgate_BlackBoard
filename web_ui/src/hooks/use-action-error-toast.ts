"use client";
// Shows a form action's error as a toast each time the action returns a new state.
import { useEffect } from "react";

import { showErrorToast } from "@/stores/toast-store";

export function useActionErrorToast(state: { error?: string | null }): void {
  useEffect(() => {
    if (state.error) showErrorToast(state.error);
  }, [state]);
}
