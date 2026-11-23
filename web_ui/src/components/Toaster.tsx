"use client";
// Renders short status messages as chat bubbles from the SpecGate robot, stacked in the corner.
import { X } from "lucide-react";
import { Toast } from "radix-ui";
import { useSyncExternalStore } from "react";

import { MascotAvatar } from "@/components/MascotAvatar";
import { t } from "@/lib/i18n";
import { dismissToast, listServerToasts, listToasts, subscribeToasts, type ToastTone } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

const DURATION_MS_BY_TONE: Record<ToastTone, number> = { error: 7000, success: 3500 };

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, listToasts, listServerToasts);
  return (
    <Toast.Provider swipeDirection="right" label={t.common.notifications}>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          type={toast.tone === "error" ? "foreground" : "background"}
          duration={DURATION_MS_BY_TONE[toast.tone]}
          onOpenChange={(isOpen) => {
            if (!isOpen) dismissToast(toast.id);
          }}
          className={cn(
            "pointer-events-auto flex w-full items-end gap-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2",
            "data-[swipe=end]:animate-out data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)",
          )}
        >
          <MascotAvatar mood={toast.tone === "error" ? "worried" : "happy"} className="size-9 shrink-0" />
          <div
            className={cn(
              "relative flex min-w-0 flex-1 items-start gap-1.5 rounded-2xl rounded-bl-sm border bg-popover py-2 pr-1.5 pl-3 text-[13px] text-popover-foreground shadow-lg",
              toast.tone === "error" ? "border-rejected-line" : "border-decided-line",
            )}
          >
            <Toast.Description className="min-w-0 flex-1 leading-snug break-words">{toast.text}</Toast.Description>
            <Toast.Close
              aria-label={t.common.close}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-3.5" />
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="pointer-events-none fixed right-0 bottom-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </Toast.Provider>
  );
}
