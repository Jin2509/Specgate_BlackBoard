// Hiển thị mã tham gia thành từng ô ký tự và nút đổi mã cho chủ workspace.
"use client";

import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { regenerateJoinCode } from "@/lib/join-actions";

export function JoinCodeDisplay({ code }: { code: string }) {
  return (
    <p aria-label={`Mã tham gia ${code.split("").join(" ")}`} className="flex justify-center gap-1.5 rounded-lg bg-input p-3">
      {code.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className="flex h-11 w-9 items-center justify-center rounded-md bg-card font-mono text-xl font-bold text-sidebar-accent-foreground"
        >
          {ch}
        </span>
      ))}
    </p>
  );
}

export function RegenerateCodeButton({
  workspaceId,
  label = "Đổi mã",
  icon = <RefreshCw />,
}: {
  workspaceId: string;
  label?: string;
  icon?: ReactNode;
}) {
  return (
    <form action={regenerateJoinCode}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton icon={icon} label={label} />
    </form>
  );
}

function SubmitButton({ icon, label }: { icon: ReactNode; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      <span className={pending ? "animate-spin" : undefined}>{icon}</span> {label}
    </Button>
  );
}
