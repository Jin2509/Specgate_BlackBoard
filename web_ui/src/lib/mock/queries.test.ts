// Test quyền thành viên, danh sách thanh workspace và trạng thái tham gia.
import { describe, expect, it } from "vitest";
import { homePath } from "@/lib/home-path";
import { getJoinRelation, getRail, getWorkspace, isMember } from "./queries";

const adom = getWorkspace("adom")!;
const cookies = (values: Record<string, string>) => ({
  get: (name: string) => (name in values ? { value: values[name] } : undefined),
});

describe("tham gia workspace", () => {
  it("Trang chưa là thành viên ADOM và đang chờ duyệt", () => {
    expect(isMember(adom, "trang")).toBe(false);
    expect(getJoinRelation(adom, "trang")).toBe("pending");
  });

  it("nhận lời mời thì thành thành viên và hiện trên thanh workspace", () => {
    expect(isMember(adom, "trang", ["adom"])).toBe(true);
    expect(getJoinRelation(adom, "trang", ["adom"])).toBe("member");
    expect(getRail("trang", ["adom"]).map((w) => w.id)).toEqual(["rieng-trang", "do-an", "adom"]);
  });

  it("workspace riêng luôn đứng đầu thanh workspace", () => {
    expect(getRail("lan")[0].kind).toBe("personal");
  });
});

describe("trang đích sau đăng nhập", () => {
  it("lần đầu vào màn chào", () => {
    expect(homePath("trang", cookies({}))).toBe("/welcome");
  });

  it("những lần sau vào workspace mở gần nhất nếu còn là thành viên", () => {
    expect(homePath("lan", cookies({ sg_onboarded: "lan", sg_last: "adom" }))).toBe("/w/adom/c/chung");
    expect(homePath("trang", cookies({ sg_onboarded: "trang", sg_last: "adom" }))).toBe("/w/rieng-trang/c/chung");
  });
});
