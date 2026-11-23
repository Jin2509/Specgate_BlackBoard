"use client";
// Signs out and reloads the whole page, so nothing of the previous account stays in this tab's memory or storage.
import { useTransition } from "react";

import { clearAllDrafts } from "@/hooks/use-draft";

import { signOut } from "../api/auth-actions";

const SIGNED_OUT_PATH = "/login";

export function useSignOut(): { isSigningOut: boolean; handleSignOut: () => void } {
  const [isSigningOut, startTransition] = useTransition();
  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      clearAllDrafts();
      // A full load, not a client navigation: the router cache keeps the previous account's pages otherwise.
      window.location.replace(SIGNED_OUT_PATH);
    });
  }
  return { isSigningOut, handleSignOut };
}
