// Thẻ lời mời: ai mời, vào workspace nào, đề bài và nút chấp nhận.
import Link from "next/link";
import { Bot, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/auth-actions";
import type { Invite, Profile, Workspace } from "@/lib/types";

export function InviteCard({
  invite,
  ws,
  inviter,
  isMember,
}: {
  invite: Invite;
  ws: Workspace;
  inviter: Profile | undefined;
  isMember: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground">
        {ws.short}
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{inviter?.displayName ?? "Một thành viên"} mời bạn tham gia</p>
      <h1 className="mt-1 text-2xl font-semibold text-sidebar-accent-foreground">{ws.name}</h1>
      <p className="mt-2 flex items-center gap-4 text-sm text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-decided" /> {ws.members.length} thành viên
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Bot className="size-4" /> {ws.agentIds.length} agent
        </span>
      </p>
      <div className="mt-5 w-full rounded-md bg-card p-3 text-left">
        <p className="text-xs font-bold tracking-wide text-subtle uppercase">Đề bài</p>
        <p className="mt-1 text-sm leading-snug text-foreground">{ws.brief}</p>
      </div>
      {isMember ? (
        <Button asChild className="mt-5 h-11 w-full text-base">
          <Link href={`/w/${ws.id}/c/chung`}>
            <Users /> Bạn đã ở đây, mở workspace
          </Link>
        </Button>
      ) : (
        <form action={acceptInvite} className="mt-5 w-full">
          <input type="hidden" name="code" value={invite.code} />
          <Button type="submit" className="h-11 w-full text-base">
            Chấp nhận lời mời
          </Button>
        </form>
      )}
      <p className="mt-3 text-xs text-subtle">Lời mời hết hạn ngày {invite.expiresAt}</p>
    </div>
  );
}
