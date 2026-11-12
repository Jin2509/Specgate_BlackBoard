// Khu vực người dùng ở đáy cột kênh: avatar, tên, cài đặt và đăng xuất.
import { LogOut, Settings } from "lucide-react";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { IconButton } from "@/components/common/icon-button";
import { signOut } from "@/lib/auth-actions";
import type { Profile } from "@/lib/types";

export function UserPanel({
  user,
  settingsHref,
  settingsLabel = "Cài đặt",
}: {
  user: Profile;
  settingsHref: string;
  settingsLabel?: string;
}) {
  return (
    <div className="flex h-13 shrink-0 items-center gap-2 border-t border-sidebar-border bg-sidebar-footer px-2">
      <ActorAvatar kind="human" initial={user.initial} size="sm" online />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{user.displayName}</p>
        <p className="truncate text-xs text-subtle">Đang trực tuyến</p>
      </div>
      <IconButton label={settingsLabel} href={settingsHref}>
        <Settings />
      </IconButton>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="inline-flex size-8 items-center justify-center rounded text-subtle transition-colors hover:bg-hover hover:text-destructive"
        >
          <LogOut className="size-5" />
        </button>
      </form>
    </div>
  );
}
