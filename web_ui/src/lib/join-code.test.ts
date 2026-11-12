// Test sinh và chuẩn hóa mã tham gia.
import { describe, expect, it } from "vitest";
import { JOIN_CODE_LENGTH, generateJoinCode, normalizeJoinCode } from "./join-code";

describe("mã tham gia", () => {
  it("sinh đúng 7 ký tự, không có ký tự dễ nhầm", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode();
      expect(code).toHaveLength(JOIN_CODE_LENGTH);
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]+$/);
    }
  });

  it("nhận chữ thường, dấu cách và gạch nối", () => {
    expect(normalizeJoinCode("adm-7q3p")).toBe("ADM7Q3P");
    expect(normalizeJoinCode("  ADM 7Q3P ")).toBe("ADM7Q3P");
  });

  it("từ chối mã sai độ dài hoặc có ký tự lạ", () => {
    expect(normalizeJoinCode("")).toBeUndefined();
    expect(normalizeJoinCode("ADM7Q3")).toBeUndefined();
    expect(normalizeJoinCode("ADM7Q3PX")).toBeUndefined();
    expect(normalizeJoinCode("ADM/Q3P")).toBeUndefined();
  });
});
