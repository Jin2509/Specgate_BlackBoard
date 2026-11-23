"use client";
// Signs out from the sidebar footer.
import { LogOut } from "lucide-react";

import { t } from "@/lib/i18n";

import { useSignOut } from "../hooks/use-sign-out";

export function SignOutButton() {
  const { isSigningOut, handleSignOut } = useSignOut();
  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label={t.auth.signOut}
      title={t.auth.signOut}
      className="inline-flex size-8 items-center justify-center rounded text-subtle transition-colors hover:bg-hover hover:text-destructive disabled:opacity-50"
    >
      <LogOut className="size-5" />
    </button>
  );
}
