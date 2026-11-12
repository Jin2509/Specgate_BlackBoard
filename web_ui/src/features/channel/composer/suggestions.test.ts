// Test logic gợi ý @ và / của ô soạn.
import { describe, expect, it } from "vitest";
import { getMembers, getWorkspace } from "@/lib/mock/queries";
import { applySuggestion, commandSuggestions, mentionSuggestions, trailingTrigger } from "./suggestions";

describe("trailingTrigger: gợi ý @ và /", () => {
  it.each([
    ["@lo", { mode: "@", query: "lo" }],
    ["hỏi @", { mode: "@", query: "" }],
    ["/de", { mode: "/", query: "de" }],
    ["xem a/b", null],
    ["email a@b", null],
    ["", null],
  ])("%j", (input, expected) => {
    expect(trailingTrigger(input)).toEqual(expected);
  });
});

describe("danh sách gợi ý", () => {
  const ws = getWorkspace("do-an")!;

  it("@ chỉ gợi ý người, lọc theo tiền tố tên", () => {
    const items = mentionSuggestions(getMembers(ws), "lo");
    expect(items.map((s) => (s.kind === "person" ? s.person.displayName : ""))).toEqual(["Long"]);
    expect(mentionSuggestions(getMembers(ws), "").every((s) => s.kind === "person")).toBe(true);
  });

  it("/ ở workspace không gắn ADOM không có lệnh mô-đun", () => {
    const names = commandSuggestions([], "").map((s) => (s.kind === "command" ? s.command.name : ""));
    expect(names).not.toContain("/stats");
  });

  it("chọn gợi ý thay từ đang gõ ở cuối và thêm dấu cách", () => {
    const [decide] = commandSuggestions([], "de");
    expect(applySuggestion("Lan ơi /de", decide)).toBe("Lan ơi /decide ");
    const [long] = mentionSuggestions(getMembers(ws), "lo");
    expect(applySuggestion("hỏi @lo", long)).toBe("hỏi @Long ");
  });
});
