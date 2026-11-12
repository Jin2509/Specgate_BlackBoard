// Nền và khung thẻ chung cho các màn đăng nhập, chào mừng và nhận lời mời.
import type { ReactNode } from "react";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";

export function AuthScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Logo className="relative mb-6 text-lg sm:absolute sm:top-8 sm:left-10 sm:mb-0" />
      <div className={cn("relative w-full rounded-xl border border-border bg-canvas p-8 shadow-float", className)}>
        {children}
      </div>
    </main>
  );
}
