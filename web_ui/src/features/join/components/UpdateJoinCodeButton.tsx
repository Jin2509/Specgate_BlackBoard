"use client";
// Lets the owner rotate (or first create) the join code; the old code stops working at once.
import { RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

import { updateJoinCode } from "../api/join-actions";

export function UpdateJoinCodeButton({ workspaceId, label = t.join.regenerate }: { workspaceId: string; label?: string }) {
  return (
    <form action={updateJoinCode}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton label={label} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={isPending}>
      <span className={isPending ? "animate-spin" : undefined}>
        <RefreshCw />
      </span>{" "}
      {label}
    </Button>
  );
}
