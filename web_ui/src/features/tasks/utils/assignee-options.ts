// Builds the "assign to" choices of the task board: every current member, the viewer marked, then nobody.
import type { SelectOption } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";

/** The value of "nobody in charge"; the server takes an empty assignee as unassigned. */
export const NOBODY = "";

export function toAssigneeOptions(members: TeamMember[], viewerId: string): SelectOption[] {
  return [
    ...members.map((member) => ({
      value: member.user.id,
      label:
        member.user.id === viewerId ? format(t.tasks.assigneeMe, { name: member.user.displayName }) : member.user.displayName,
    })),
    { value: NOBODY, label: t.tasks.unassigned },
  ];
}
