// Test logic gợi ý @ và / của ô soạn.
import { describe, expect, it } from "vitest";
import { getAgents, getMembers, getWorkspace } from "@/lib/mock/queries";
import { applySuggestion, commandSuggestions, mentionSuggestions, trailingTrigger } from "./suggestions";

describe("trailingTrigger: gợi ý @ và /", () => {
  it.each([
    ["@cr", { mode: "@", query: "cr" }],
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

  it("@ lọc agent đang bật theo tiền tố, agent đứng trước người", () => {
    const items = mentionSuggestions(getAgents(ws), getMembers(ws), "");
    expect(items[0].kind).toBe("agent");
    const critic = mentionSuggestions(getAgents(ws), [], "cr");
    expect(critic.map((s) => (s.kind === "agent" ? s.agent.handle : ""))).toEqual(["critic"]);
  });

  it("/ ở workspace không gắn ADOM không có lệnh mô-đun", () => {
    const names = commandSuggestions([], "").map((s) => (s.kind === "command" ? s.command.name : ""));
    expect(names).not.toContain("/stats");
  });

  it("chọn gợi ý thay từ đang gõ ở cuối và thêm dấu cách", () => {
    const [decide] = commandSuggestions([], "de");
    expect(applySuggestion("Lan ơi /de", decide)).toBe("Lan ơi /decide ");
  });
});
