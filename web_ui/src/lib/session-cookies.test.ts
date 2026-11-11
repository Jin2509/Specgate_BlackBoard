// Test các hàm đọc/ghi cookie phiên và tách mã mời.
import { describe, expect, it } from "vitest";
import { addToList, inviteCodeFrom, joinedOf, safeNext } from "./session-cookies";

describe("cookie phiên", () => {
  it("chỉ lấy workspace đã tham gia của đúng người", () => {
    expect(joinedOf("trang:adom,lan:on-thi,trang:do-an", "trang")).toEqual(["adom", "do-an"]);
    expect(joinedOf(undefined, "trang")).toEqual([]);
  });

  it("không thêm trùng vào danh sách", () => {
    expect(addToList("trang", "trang")).toBe("trang");
    expect(addToList("trang", "lan")).toBe("trang,lan");
  });

  it("chỉ nhận trang đích nội bộ", () => {
    expect(safeNext("/invite/abc")).toBe("/invite/abc");
    expect(safeNext("//evil.com")).toBeUndefined();
    expect(safeNext("https://evil.com")).toBeUndefined();
  });

  it("tách mã từ liên kết mời hoặc mã trần", () => {
    expect(inviteCodeFrom("http://localhost:3000/invite/doan-kc26")).toBe("doan-kc26");
    expect(inviteCodeFrom("  adom-main ")).toBe("adom-main");
    expect(inviteCodeFrom("có dấu cách")).toBeUndefined();
    expect(inviteCodeFrom("")).toBeUndefined();
  });
});
