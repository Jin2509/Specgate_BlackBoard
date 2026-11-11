// Test thẻ tiêu chí.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCriteria } from "@/lib/mock/queries";
import { CriterionCard } from "./criterion-card";

const criteria = getCriteria();

describe("CriterionCard", () => {
  it("tiêu chí 5 vượt ngưỡng nhưng vẫn hiện Thiếu dữ liệu, không phải PASS", () => {
    const c5 = criteria.find((c) => c.number === 5)!;
    render(<CriterionCard c={c5} workspaceId="adom" />);
    const badge = screen.getByText("Thiếu dữ liệu");
    expect(badge).toHaveAttribute("data-tone", "insufficient");
    expect(screen.queryByText("PASS")).not.toBeInTheDocument();
  });

  it("hiện huy hiệu ý đã chốt khi có kết luận (đường nối 4)", () => {
    render(<CriterionCard c={criteria[2]} workspaceId="adom" decidedIdeas={1} />);
    expect(screen.getByText(/1 ý đã chốt/)).toBeInTheDocument();
  });
});
