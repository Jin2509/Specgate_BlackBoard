"use client";
// Picks the shared workspace whose team context the agent reads in this conversation; a change is saved at once.
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Select } from "@/components/ui/Select";
import { t } from "@/lib/i18n";
import { cn } from "@/utils/cn";

import { updateConversationWorkspace } from "../api/conversation-actions";
import type { WorkspaceOption } from "../utils/workspace-option";

export function ContextPicker({
  conversationId,
  value,
  options,
  className,
}: {
  conversationId: string;
  value?: string;
  options: WorkspaceOption[];
  className?: string;
}) {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();

  function handleChange(nextWorkspaceId: string) {
    setWorkspaceId(nextWorkspaceId);
    const formData = new FormData();
    formData.set("conversationId", conversationId);
    formData.set("workspaceId", nextWorkspaceId);
    startTransition(async () => {
      await updateConversationWorkspace(formData);
      router.refresh();
    });
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <label htmlFor="context-workspace" className="flex items-center gap-1 text-[0.8125rem] text-subtle">
        <Users className="size-4" />
        <span className="@max-3xl/header:sr-only">{t.personal.teamContext}</span>
      </label>
      <Select
        id="context-workspace"
        value={workspaceId}
        onValueChange={handleChange}
        isDisabled={isPending}
        className="max-w-48"
        options={[
          { value: "", label: t.personal.notLinked },
          ...options.map((option) => ({ value: option.id, label: option.name })),
        ]}
      />
    </div>
  );
}
