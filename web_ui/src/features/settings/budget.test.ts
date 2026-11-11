// Test tính mức dùng trần chi phí.
import { describe, expect, it } from "vitest";
import { budgetLevel } from "./budget";

describe("budgetLevel: trần chi phí", () => {
  it("cảnh báo từ 90%, chặn khi chạm trần", () => {
    expect(budgetLevel(1.42, 5)).toMatchObject({ warn: false, over: false });
    expect(budgetLevel(4.86, 5)).toMatchObject({ warn: true, over: false });
    expect(budgetLevel(5, 5)).toMatchObject({ warn: true, over: true, ratio: 1 });
  });
});
