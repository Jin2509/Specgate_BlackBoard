// Test quyền thành viên, danh sách thanh workspace và trang đích sau đăng nhập.
import { beforeEach, describe, expect, it } from "vitest";
import { homePath } from "@/lib/home-path";
import {
  findOAuthAccount,
  getJoinRelation,
  getOAuthAccounts,
  getPersonalWorkspace,
  getRail,
  getWorkspace,
  isMember,
} from "./queries";
import { resetStore } from "./store";

const cookies = (values: Record<string, string>) => ({
  get: (name: string) => (name in values ? { value: values[name] } : undefined),
});

beforeEach(resetStore);

describe("tham gia workspace", () => {
  it("Trang chưa là thành viên workspace chung, chưa gửi yêu cầu", () => {
    const ws = getWorkspace("do-an")!;
    expect(isMember(ws, "trang")).toBe(false);
    expect(getJoinRelation(ws, "trang")).toBe("none");
    expect(getJoinRelation(ws, "lan")).toBe("member");
  });

  it("workspace riêng luôn đứng đầu thanh workspace", () => {
    expect(getRail("lan").map((w) => w.id)).toEqual(["rieng-lan", "do-an"]);
  });

  it("tài khoản mới chỉ có workspace riêng", () => {
    expect(getRail("trang").map((w) => w.id)).toEqual(["rieng-trang"]);
  });

  it("ai đăng nhập được cũng có workspace riêng", () => {
    for (const p of ["github", "google"] as const) {
      for (const a of getOAuthAccounts(p)) expect(getPersonalWorkspace(a.userId)).toBeDefined();
    }
  });
});

describe("đăng nhập", () => {
  it("chỉ nhận GitHub và Google, đúng tài khoản của từng nhà cung cấp", () => {
    expect(findOAuthAccount("github", "lan")?.login).toBe("lan-pham");
    expect(findOAuthAccount("google", "trang")?.login).toBe("trang@example.edu");
    expect(findOAuthAccount("email", "trang")).toBeUndefined();
    expect(findOAuthAccount("github", "trang")).toBeUndefined();
  });
});

describe("trang đích sau đăng nhập", () => {
  it("lần đầu vào thẳng workspace riêng", () => {
    expect(homePath("trang", cookies({}))).toBe("/w/rieng-trang/chat");
    expect(homePath("lan", cookies({}))).toBe("/w/rieng-lan/chat");
  });

  it("những lần sau vào workspace mở gần nhất nếu còn là thành viên", () => {
    expect(homePath("lan", cookies({ sg_last: "do-an" }))).toBe("/w/do-an/c/chung");
    expect(homePath("trang", cookies({ sg_last: "do-an" }))).toBe("/w/rieng-trang/chat");
  });
});
