// Renders the SpecGate wordmark: the gate mark followed by the product name.
import { t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

import { LogoMark } from "./LogoMark";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-foreground", className)}>
      <LogoMark />
      {t.common.brand}
    </span>
  );
}
