// Danh sách tài khoản của một nhà cung cấp OAuth; chọn một tài khoản là đăng nhập.
"use client";

import { ChevronRight } from "lucide-react";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { useQueryParam } from "@/hooks/use-query-param";
import { signIn } from "@/lib/auth-actions";
import type { AuthProvider } from "@/lib/types";

export interface ChooserAccount {
  userId: string;
  login: string;
  displayName: string;
  initial: string;
}

export function AccountChooser({ provider, accounts }: { provider: AuthProvider; accounts: ChooserAccount[] }) {
  const next = useQueryParam("next") ?? "";
  return (
    <ul className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border">
      {accounts.map((a) => (
        <li key={a.userId}>
          <form action={signIn}>
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="account" value={a.userId} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
            >
              <ActorAvatar kind="human" initial={a.initial} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-sidebar-accent-foreground">{a.displayName}</span>
                <span className="block truncate font-mono text-xs text-subtle">{a.login}</span>
              </span>
              <ChevronRight className="size-4 text-subtle" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
