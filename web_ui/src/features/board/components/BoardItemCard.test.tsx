// Tests the idea board card: reason and decider, clickable cards and agent authorship.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";
import type { BoardCard } from "@/types/board";

import { BoardItemCard, toCardFooter } from "./BoardItemCard";

const BASE_CARD = {
  kind: "idea" as const,
  reason: null,
  at: "2026-11-12T06:05:00Z",
  atLabel: "13:05",
  source: { channelId: null, messageId: null },
  createdBy: { kind: "agent" as const, id: "lan" },
  authorName: "Claude of Lan",
};

const REJECTED_CARD: BoardCard = {
  ...BASE_CARD,
  id: "i4",
  number: 4,
  body: "Prove a sorting algorithm formally in Coq",
  status: "rejected",
  reason: "Nobody in the team knows Coq.",
  decidedBy: { id: "lan", at: "2026-11-12T06:22:00Z" },
  decidedAtLabel: "13:22",
  deciderName: "Lan",
};

const PROPOSED_CARD: BoardCard = {
  ...BASE_CARD,
  id: "i1",
  number: 1,
  body: "Compare coverage of human-written and generated tests",
  status: "proposed",
};

describe("BoardItemCard", () => {
  it("should show the reason and who rejected a rejected idea", () => {
    render(<BoardItemCard card={REJECTED_CARD} />);
    expect(screen.getByText(t.board.reasonLabel)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Lan ${t.status.verbRejected}`))).toBeInTheDocument();
  });

  it("should render a button when the card is clickable", () => {
    render(<BoardItemCard card={PROPOSED_CARD} onClick={() => undefined} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should name the agent that raised an idea", () => {
    expect(toCardFooter(PROPOSED_CARD, true)).toBe("Claude of Lan");
    expect(toCardFooter(PROPOSED_CARD, false)).toBe("Claude of Lan, 13:05");
  });
});
