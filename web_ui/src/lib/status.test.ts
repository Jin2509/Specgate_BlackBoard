// Test màu trạng thái, lệnh theo mô-đun và bản tổng hợp.
import { describe, expect, it } from "vitest";
import { IDEA_COLUMNS, toneClasses, verdictMeta } from "@/lib/status";
import { commandsFor } from "@/lib/commands";
import { buildBrief, briefToMarkdown } from "@/lib/brief";
import { boards } from "@/lib/mock/data";

describe("màu phán quyết (PDF 6.2)", () => {
  it("INSUFFICIENT_DATA không bao giờ dùng tông của PASS", () => {
    const pass = verdictMeta.PASS.tone;
    const insufficient = verdictMeta.INSUFFICIENT_DATA.tone;
    expect(insufficient).not.toBe(pass);
    expect(toneClasses[insufficient].text).not.toBe(toneClasses[pass].text);
    expect(toneClasses[insufficient].bar).not.toBe(toneClasses[pass].bar);
  });

  it("mỗi phán quyết có một tông riêng", () => {
    const tones = Object.values(verdictMeta).map((v) => v.tone);
    expect(new Set(tones).size).toBe(tones.length);
  });

  it("bảng ý tưởng có đúng bốn cột theo thứ tự vòng đời", () => {
    expect(IDEA_COLUMNS).toEqual(["proposed", "discussing", "decided", "rejected"]);
  });
});

describe("lệnh theo mô-đun", () => {
  it("workspace không gắn mô-đun chỉ có lệnh của lõi", () => {
    const names = commandsFor([]).map((c) => c.name);
    expect(names).toEqual(["/idea", "/pin", "/note", "/decide", "/summarize", "/brief", "/help"]);
  });

  it("gắn ADOM thì có thêm /stats /task /run", () => {
    const names = commandsFor(["adom"]).map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(["/stats", "/task", "/run"]));
  });
});

describe("bản tổng hợp", () => {
  const brief = buildBrief("Đề tài", boards["do-an"]);

  it("chỉ dựng từ thẻ trên bảng, chia đúng nhóm", () => {
    expect(brief.decided.map((i) => i.id)).toEqual(["i3"]);
    expect(brief.rejected.map((i) => i.id)).toEqual(["i4"]);
    expect(brief.openQuestions.map((i) => i.id)).toEqual(["q1"]);
  });

  it("Markdown có đủ các mục và lý do", () => {
    const md = briefToMarkdown(brief, "Chọn đề tài");
    for (const h of ["## Đã chốt", "## Đã loại", "## Còn đang bàn", "## Câu hỏi mở"]) expect(md).toContain(h);
    expect(md).toContain("Vì không ai trong nhóm biết Coq");
  });
});
