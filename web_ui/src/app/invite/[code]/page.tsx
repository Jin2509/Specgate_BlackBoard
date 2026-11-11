// Trang nhận lời mời vào workspace chung qua liên kết.
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/features/login/auth-screen";
import { InviteCard } from "@/features/onboarding/invite-card";
import { getInvite, getProfile, getWorkspace, isMember } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Lời mời" };

export default function InvitePage({ params }: PageProps<"/invite/[code]">) {
  return (
    <AuthScreen className="max-w-120">
      <Suspense fallback={<div className="h-96" />}>
        <InviteContent params={params} />
      </Suspense>
    </AuthScreen>
  );
}

async function InviteContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { user, joined } = await requireSession(`/invite/${code}`);
  const invite = getInvite(code);
  const ws = getWorkspace(invite?.workspaceId);

  if (!invite || !ws) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-sidebar-accent-foreground">Lời mời không hợp lệ</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Liên kết có thể đã hết hạn, hoặc bạn không có quyền vào.</p>
        <Button asChild className="mt-6 h-11 w-full text-base">
          <Link href="/" prefetch={false}>
            Về trang của bạn
          </Link>
        </Button>
      </div>
    );
  }

  return <InviteCard invite={invite} ws={ws} inviter={getProfile(invite.createdBy)} isMember={isMember(ws, user.id, joined)} />;
}
