"use client";
// Lists the registered accounts of a provider on the simulated provider screen; choosing one signs in.
import { ChevronRight } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { useQueryParam } from "@/hooks/use-query-param";
import type { AuthProvider } from "@/types/profile";

import { signIn } from "../api/auth-actions";

export interface ChooserAccount {
  login: string;
  displayName: string;
  initial: string;
}

export function AccountChooser({ provider, accounts }: { provider: AuthProvider; accounts: ChooserAccount[] }) {
  const next = useQueryParam("next") ?? "";
  return (
    <ul className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border">
      {accounts.map((account) => (
        <li key={account.login}>
          <form action={signIn}>
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="login" value={account.login} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
            >
              <ActorAvatar kind="human" initial={account.initial} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-sidebar-accent-foreground">{account.displayName}</span>
                <span className="block truncate font-mono text-xs text-subtle">{account.login}</span>
              </span>
              <ChevronRight className="size-4 text-subtle" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
