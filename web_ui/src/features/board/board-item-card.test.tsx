// Test thẻ mục trên bảng ý tưởng.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getBoard } from "@/lib/mock/queries";
import { BoardItemCard, cardFooter } from "./board-item-card";

const board = getBoard("do-an");
const byId = (id: string) => board.find((i) => i.id === id)!;

describe("BoardItemCard", () => {
  it("ý đã loại hiện lý do và người loại", () => {
    render(<BoardItemCard item={byId("i4")} />);
    expect(screen.getByText("Lý do:")).toBeInTheDocument();
    expect(screen.getByText(/Lan loại/)).toBeInTheDocument();
  });

  it("có onClick thì thẻ là nút bấm được", () => {
    render(<BoardItemCard item={byId("i2")} onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("ý do agent nêu ghi rõ agent của ai", () => {
    expect(cardFooter(byId("i1"), true)).toBe("Agent của Lan");
  });
});
