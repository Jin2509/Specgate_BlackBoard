"use client";
// Shows a banner at the top of the screen while the browser is offline.
import { WifiOff } from "lucide-react";

import { useOnline } from "@/hooks/use-online";
import { t } from "@/lib/i18n";

export function ConnectionBanner() {
  const isOnline = useOnline();
  if (isOnline) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-proposed px-4 py-1.5 text-[0.8125rem] font-medium text-primary-foreground"
    >
      <WifiOff className="size-4" /> {t.common.offline}
    </div>
  );
}
