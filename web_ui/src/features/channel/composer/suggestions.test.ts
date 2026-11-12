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

describe("gợi ý highlight", () => {
  const h = {
    id: "h1",
    ownerId: "trang",
    conversationId: "c1",
    turnId: "c1-4",
    text: "Rủi ro chính: đặc tả thường lệch với hành vi thật",
    label: "review" as const,
    at: "12/11 09:17",
  };

  it("@ liệt kê highlight sau agent và người, lọc theo nội dung", () => {
    const ws = getWorkspace("do-an")!;
    const all = mentionSuggestions(getAgents(ws), getMembers(ws), "", [h]);
    expect(all.at(-1)?.kind).toBe("highlight");
    expect(mentionSuggestions([], [], "đặc tả", [h])).toHaveLength(1);
    expect(mentionSuggestions([], [], "coq", [h])).toHaveLength(0);
  });

  it("chọn highlight chỉ xóa từ @ đang gõ, không chèn chữ", () => {
    expect(applySuggestion("xem đoạn này @đặc", { kind: "highlight", highlight: h })).toBe("xem đoạn này ");
  });
});
