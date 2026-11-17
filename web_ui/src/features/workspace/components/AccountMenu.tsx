"use client";
// Opens the signed-in person's account menu: who is signed in, personal settings and sign-out.
import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { ActorAvatar } from "@/components/ActorAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { signOut } from "@/features/auth";
import { t } from "@/lib/i18n";
import type { Profile } from "@/types/profile";

export function AccountMenu({
  user,
  settingsHref,
  settingsLabel,
}: {
  user: Profile;
  settingsHref: string;
  settingsLabel: string;
}) {
  const [isSigningOut, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={user.displayName}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ActorAvatar kind="human" initial={user.initial} colorIndex={user.color} size="sm" isOnline />
        <span className="max-w-40 truncate max-sm:hidden">{user.displayName}</span>
        <ChevronDown className="size-4 text-subtle" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
          <ActorAvatar kind="human" initial={user.initial} colorIndex={user.color} size="sm" isOnline />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-foreground">{user.displayName}</span>
            <span className="block truncate text-xs font-normal text-subtle">{t.auth.online}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>
            <Settings /> {settingsLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={isSigningOut} onSelect={() => startTransition(() => signOut())}>
          <LogOut /> {t.auth.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
