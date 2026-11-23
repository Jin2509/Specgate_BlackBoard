// Renders the signed-in person at the bottom of a sidebar, with settings and sign-out buttons.
import { Settings } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { IconButton } from "@/components/IconButton";
import { SignOutButton } from "@/features/auth";
import { t } from "@/lib/i18n";
import type { Profile } from "@/types/profile";

export function UserPanel({ user, settingsHref, settingsLabel }: { user: Profile; settingsHref: string; settingsLabel: string }) {
  return (
    <div className="flex h-13 shrink-0 items-center gap-2 border-t border-sidebar-border bg-sidebar-footer px-2">
      <ActorAvatar kind="human" initial={user.initial} colorIndex={user.color} size="sm" isOnline />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{user.displayName}</p>
        <p className="truncate text-xs text-subtle">{t.auth.online}</p>
      </div>
      <IconButton label={settingsLabel} href={settingsHref}>
        <Settings />
      </IconButton>
      <SignOutButton />
    </div>
  );
}
