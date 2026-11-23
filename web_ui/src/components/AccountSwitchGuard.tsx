"use client";
// Reloads the whole page when this tab finds a different signed-in account, so no page of the previous one survives.
import { useEffect } from "react";

const ACCOUNT_STORAGE_KEY = "sg:account";

export function AccountSwitchGuard({ userId }: { userId: string }) {
  useEffect(() => {
    try {
      const previousUserId = window.sessionStorage.getItem(ACCOUNT_STORAGE_KEY);
      window.sessionStorage.setItem(ACCOUNT_STORAGE_KEY, userId);
      // The client router may still hold pages rendered for the previous account; only a full load drops them.
      if (previousUserId && previousUserId !== userId) window.location.reload();
    } catch {
      // Storage can be blocked (private window); sign-out still reloads the page itself.
    }
  }, [userId]);
  return null;
}
