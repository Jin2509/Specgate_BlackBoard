// Test sinh lệnh /decide.
import { describe, expect, it } from "vitest";
import { decideCommand } from "./decide-command";

describe("decideCommand", () => {
  it("rút gọn lý do dài và đổi động từ theo quyết định", () => {
    expect(decideCommand(4, "rejected", "Thư viện đã được kiểm thử kỹ, khó ra kết quả")).toBe(
      "/decide #4 loại Thư viện đã được kiểm thử kỹ…",
    );
    expect(decideCommand(3, "decided", "Vừa 3 tuần")).toBe("/decide #3 chốt Vừa 3 tuần");
  });

  it("chưa có lý do thì không để dấu cách thừa", () => {
    expect(decideCommand(2, "decided", "  ")).toBe("/decide #2 chốt");
  });
});
