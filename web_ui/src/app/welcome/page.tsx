// Màn chào sau lần đăng nhập đầu: chọn cách bắt đầu hoặc dán liên kết mời.
import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteCodeForm } from "@/features/explore/invite-code-form";
import { AuthScreen } from "@/features/login/auth-screen";
import { InviteError } from "@/features/onboarding/invite-error";
import { WelcomeOptions } from "@/features/onboarding/welcome-options";
import { getPersonalWorkspace } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Bắt đầu" };

export default function WelcomePage() {
  return (
    <AuthScreen className="max-w-120">
      <Suspense fallback={<div className="h-96" />}>
        <Welcome />
      </Suspense>
    </AuthScreen>
  );
}

async function Welcome() {
  const { user } = await requireSession("/welcome");
  const personal = getPersonalWorkspace(user.id);

  return (
    <>
      <h1 className="text-center text-2xl font-semibold text-sidebar-accent-foreground">Chào {user.displayName}!</h1>
      <p className="mt-2 mb-6 text-center text-[15px] text-muted-foreground">Bạn đã có một workspace riêng. Bắt đầu từ đâu?</p>
      {personal ? <WelcomeOptions personalId={personal.id} /> : null}
      <div className="mt-6 grid gap-2 border-t border-border pt-5">
        <p className="text-center text-sm font-semibold text-sidebar-accent-foreground">Đã có lời mời?</p>
        <InviteCodeForm />
        <InviteError />
      </div>
    </>
  );
}
