"use client";
// Opens the join-by-code form in a dialog from the workspace bar.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { t } from "@/lib/i18n";

import { JoinCodeForm } from "./JoinCodeForm";

export function JoinCodeDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{t.join.codeDialogTitle}</DialogTitle>
          <DialogDescription>{t.join.codeDialogDescription}</DialogDescription>
        </DialogHeader>
        {isOpen ? <JoinCodeForm shouldAutoFocus /> : null}
      </DialogContent>
    </Dialog>
  );
}
