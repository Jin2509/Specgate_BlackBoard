// Tests searching shared workspaces on the Explore page.
import { describe, expect, it } from "vitest";

import type { ExploreCard } from "@/types/join";

import { searchWorkspaces } from "./search-workspaces";

function toCard(id: string, name: string, brief: string): ExploreCard {
  return { id, name, short: name.slice(0, 1), brief, ownerName: "Lan", memberCount: 2, relation: "none", pendingRequestId: null };
}

const WORKSPACES = [
  toCard("thesis", "Verification Thesis", "Pick a topic with measurable testing."),
  toCard("adom", "ADOM Research", "Criterion 3 gets data in the next run."),
];

describe("searchWorkspaces", () => {
  it("should match the name or the brief ignoring case", () => {
    expect(searchWorkspaces(WORKSPACES, "THESIS").map((workspace) => workspace.id)).toEqual(["thesis"]);
    expect(searchWorkspaces(WORKSPACES, "measurable").map((workspace) => workspace.id)).toEqual(["thesis"]);
  });

  it("should return everything for a blank query and nothing for an unknown one", () => {
    expect(searchWorkspaces(WORKSPACES, "   ")).toHaveLength(WORKSPACES.length);
    expect(searchWorkspaces(WORKSPACES, "nothing-matches")).toHaveLength(0);
  });
});
