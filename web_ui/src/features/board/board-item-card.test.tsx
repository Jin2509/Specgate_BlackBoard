// Test thẻ mục trên bảng ý tưởng.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getBoard } from "@/lib/mock/queries";
import { BoardItemCard, cardFooter } from "./board-item-card";

const board = getBoard("do-an");
const byId = (id: string) => board.find((i) => i.id === id)!;

describe("BoardItemCard", () => {
  it("ý đã loại hiện lý do và người loại", () => {
    render(<BoardItemCard item={byId("i6")} />);
    expect(screen.getByText("Lý do:")).toBeInTheDocument();
    expect(screen.getByText(/Lan loại/)).toBeInTheDocument();
  });

  it("có onClick thì thẻ là nút bấm được", () => {
    render(<BoardItemCard item={byId("i4")} onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("thẻ từ gói ngữ cảnh ghi rõ nguồn", () => {
    const fromCapsule = board.find((i) => i.fromCapsule)!;
    expect(cardFooter(fromCapsule, true)).toContain("từ gói ngữ cảnh");
  });
});
