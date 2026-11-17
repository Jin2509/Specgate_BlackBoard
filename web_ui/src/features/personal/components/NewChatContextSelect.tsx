"use client";
// Picks the team context of a new conversation; nothing is saved yet, the choice goes with the first question.
import { Users } from "lucide-react";

import { Select } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";

import type { WorkspaceOption } from "../utils/workspace-option";

export function NewChatContextSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (workspaceId: string) => void;
  options: WorkspaceOption[];
}) {
  return (
    <div className="flex items-center gap-1 text-xs text-subtle">
      <Users className="size-3.5" />
      <Select
        aria-label={t.personal.teamContext}
        size="sm"
        value={value}
        onValueChange={onChange}
        className="max-w-56"
        options={[
          { value: "", label: t.personal.notLinkedShared },
          ...options.map((option) => ({ value: option.id, label: format(t.personal.contextOption, { name: option.name }) })),
        ]}
      />
    </div>
  );
}
