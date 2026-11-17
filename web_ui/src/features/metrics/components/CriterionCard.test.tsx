// Tests that a criterion clearing its threshold without enough data never reads as a pass.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { format, t } from "@/lib/i18n";
import { sampleCriteria } from "@/test/fixtures/metrics";

import { CriterionCard } from "./CriterionCard";

describe("CriterionCard", () => {
  it("should show insufficient data, not pass, when criterion 5 clears its threshold", () => {
    const criterion = sampleCriteria.find((sample) => sample.number === 5)!;
    render(<CriterionCard criterion={criterion} workspaceId="w" />);
    expect(screen.getByText(t.status.insufficient)).toHaveAttribute("data-tone", "insufficient");
    expect(screen.queryByText(t.status.pass)).not.toBeInTheDocument();
  });

  it("should show the decided ideas badge when the criterion has conclusions", () => {
    render(<CriterionCard criterion={sampleCriteria[0]} workspaceId="w" decidedIdeaCount={1} />);
    expect(screen.getByText(new RegExp(format(t.metrics.decidedIdeas, { count: 1 })))).toBeInTheDocument();
  });
});
