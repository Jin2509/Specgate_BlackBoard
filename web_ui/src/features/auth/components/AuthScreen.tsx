// Frames the sign-in, sign-up and join screens: the forest photo, the logo and a frosted-glass card.
import type { ReactNode } from "react";

import { LogoMark } from "@/components/LogoMark";
import { t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

import { PhotoBackdrop } from "./PhotoBackdrop";

export function AuthScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <PhotoBackdrop />
      <span className="mb-8 inline-flex items-center gap-2 text-lg font-semibold text-foreground sm:absolute sm:top-8 sm:left-10 sm:mb-0">
        <LogoMark className="size-8 text-foreground" />
        {t.common.brand}
      </span>
      <div
        className={cn(
          "w-full rounded-2xl border border-foreground/15 bg-card/85 p-8 text-foreground shadow-2xl backdrop-blur-xl",
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}
