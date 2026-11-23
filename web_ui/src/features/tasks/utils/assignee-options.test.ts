// Tests the "assign to" choices offered to the workspace owner.
import { describe, expect, it } from "vitest";

import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";

import { NOBODY, toAssigneeOptions } from "./assignee-options";

function member(id: string, displayName: string): TeamMember {
  return {
    user: { id, displayName, initial: displayName[0], color: 0 },
    role: "member",
    teamRole: null,
    agent: null,
  } as TeamMember;
}

describe("toAssigneeOptions", () => {
  it("should list every member, mark the viewer and end with nobody", () => {
    const options = toAssigneeOptions([member("u_lan", "Lan"), member("u_long", "Long")], "u_lan");
    expect(options).toEqual([
      { value: "u_lan", label: format(t.tasks.assigneeMe, { name: "Lan" }) },
      { value: "u_long", label: "Long" },
      { value: NOBODY, label: t.tasks.unassigned },
    ]);
  });
});
