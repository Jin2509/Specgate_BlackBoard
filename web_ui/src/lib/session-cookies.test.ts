// Test kiểm tra trang đích sau đăng nhập chỉ là đường dẫn nội bộ.
import { describe, expect, it } from "vitest";
import { safeNext } from "./session-cookies";

describe("cookie phiên", () => {
  it("chỉ nhận trang đích nội bộ", () => {
    expect(safeNext("/join/r1")).toBe("/join/r1");
    expect(safeNext("//evil.com")).toBeUndefined();
    expect(safeNext("https://evil.com")).toBeUndefined();
    expect(safeNext(null)).toBeUndefined();
  });
});
