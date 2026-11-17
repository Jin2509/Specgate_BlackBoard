"use client";
// Edits the user's role in the team, which every member's agent reads.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateTeamRole } from "@/features/settings";
import { t } from "@/lib/i18n";

const TEAM_ROLE_MAX_LENGTH = 40;

export function TeamRoleForm({ workspaceId, teamRole }: { workspaceId: string; teamRole: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(teamRole ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-wrap gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const outcome = await updateTeamRole(workspaceId, value);
          setError(outcome.ok ? null : outcome.error);
          if (outcome.ok) router.refresh();
        });
      }}
    >
      <label htmlFor="team-role" className="sr-only">
        {t.personal.myTeamRole}
      </label>
      <input
        id="team-role"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t.personal.teamRolePlaceholder}
        maxLength={TEAM_ROLE_MAX_LENGTH}
        className="h-8 min-w-0 flex-1 rounded-md border border-border bg-input px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-8 rounded-md border border-border px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {t.common.save}
      </button>
      {error ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
