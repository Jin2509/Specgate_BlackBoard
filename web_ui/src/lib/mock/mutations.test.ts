// Test luồng Script2: chia sẻ mã, nhập mã chờ duyệt, chủ duyệt hoặc từ chối, đổi mã.
import { beforeEach, describe, expect, it } from "vitest";
import {
  addHighlight,
  cancelJoinRequest,
  chooseModel,
  decideJoinRequest,
  deleteConversation,
  postChannelMessage,
  promoteHighlight,
  registerAccount,
  rotateJoinCode,
  saveProviderKey,
  sendTurn,
  submitJoinRequest,
} from "./mutations";
import {
  findOAuthIdentity,
  findWorkspaceByCode,
  getConversation,
  getConversations,
  getHighlights,
  getJoinCode,
  getJoinRelation,
  getPendingJoins,
  getPersonalWorkspace,
  getProfile,
  getProviderKey,
  getRail,
  getWorkspace,
  isHighlightOnBoard,
} from "./queries";
import { resetStore } from "./store";

beforeEach(resetStore);

function joinByCode(userId: string, code: string) {
  const ws = findWorkspaceByCode(code)!;
  const result = submitJoinRequest({ workspaceId: ws.id, userId, via: "code", code });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe("tham gia bằng mã", () => {
  it("nhập mã thì tạo yêu cầu chờ duyệt, chưa vào workspace", () => {
    const req = joinByCode("trang", getJoinCode("do-an")!.code);
    expect(req.status).toBe("pending");
    expect(getJoinRelation(getWorkspace("do-an")!, "trang")).toBe("pending");
    expect(getRail("trang").map((w) => w.id)).toEqual(["rieng-trang"]);
    expect(getPendingJoins("trang").map((p) => p.ws.id)).toEqual(["do-an"]);
  });

  it("nhập lại mã không tạo yêu cầu trùng", () => {
    const code = getJoinCode("do-an")!.code;
    expect(joinByCode("trang", code).id).toBe(joinByCode("trang", code).id);
  });

  it("chủ duyệt thì thành thành viên, workspace hiện trên thanh", () => {
    const req = joinByCode("trang", getJoinCode("do-an")!.code);
    const result = decideJoinRequest(req.id, "lan", true);
    expect(result.ok).toBe(true);
    expect(getJoinRelation(getWorkspace("do-an")!, "trang")).toBe("member");
    expect(getRail("trang").map((w) => w.id)).toEqual(["rieng-trang", "do-an"]);
    expect(getPendingJoins("trang")).toEqual([]);
  });

  it("chỉ chủ workspace duyệt được", () => {
    const req = joinByCode("trang", getJoinCode("do-an")!.code);
    expect(decideJoinRequest(req.id, "trang", true)).toEqual({ ok: false, error: "forbidden" });
    expect(getJoinRelation(getWorkspace("do-an")!, "trang")).toBe("pending");
  });

  it("từ chối thì không vào, không xử lý lại được", () => {
    const req = joinByCode("trang", getJoinCode("do-an")!.code);
    decideJoinRequest(req.id, "lan", false);
    expect(getJoinRelation(getWorkspace("do-an")!, "trang")).toBe("none");
    expect(decideJoinRequest(req.id, "lan", true)).toEqual({ ok: false, error: "not-pending" });
  });

  it("người xin tự hủy được yêu cầu đang chờ", () => {
    const req = joinByCode("trang", getJoinCode("do-an")!.code);
    expect(cancelJoinRequest(req.id, "lan").ok).toBe(false);
    expect(cancelJoinRequest(req.id, "trang").ok).toBe(true);
    expect(getJoinRelation(getWorkspace("do-an")!, "trang")).toBe("none");
  });

  it("đã là thành viên thì không gửi yêu cầu", () => {
    expect(submitJoinRequest({ workspaceId: "do-an", userId: "lan", via: "code" })).toEqual({
      ok: false,
      error: "already-member",
    });
  });
});

describe("đổi mã", () => {
  it("chỉ chủ đổi được; mã cũ hết hiệu lực", () => {
    const old = getJoinCode("do-an")!.code;
    expect(rotateJoinCode("do-an", "trang")).toEqual({ ok: false, error: "forbidden" });
    const next = rotateJoinCode("do-an", "lan");
    expect(next.ok && next.value.code).not.toBe(old);
    expect(findWorkspaceByCode(old)).toBeUndefined();
    expect(findWorkspaceByCode(getJoinCode("do-an")!.code)?.id).toBe("do-an");
  });

  it("workspace riêng không có mã", () => {
    expect(rotateJoinCode("rieng-lan", "lan")).toEqual({ ok: false, error: "not-found" });
  });
});

describe("workspace riêng: key", () => {
  it("key sai bị từ chối; key hợp lệ chỉ lưu 4 ký tự cuối", () => {
    expect(saveProviderKey({ userId: "lan", provider: "anthropic", apiKey: "ngan" })).toEqual({
      ok: false,
      error: "invalid-key",
    });
    const ok = saveProviderKey({ userId: "lan", provider: "anthropic", apiKey: "sk-ant-abcdefghijklmn7x2q" });
    expect(ok.ok && ok.value.keyLast4).toBe("7x2q");
    expect(JSON.stringify(getProviderKey("lan"))).not.toContain("abcdefghijklmn");
  });

  it("key hết hạn mức báo lỗi riêng", () => {
    expect(saveProviderKey({ userId: "lan", provider: "anthropic", apiKey: "sk-ant-abcdefghijklmn0000" })).toEqual({
      ok: false,
      error: "quota",
    });
  });

  it("chỉ chọn được mô hình nằm trong danh sách nhà cung cấp trả về", () => {
    expect(chooseModel("trang", "khong-co").ok).toBe(false);
    expect(chooseModel("trang", "claude-haiku-5-5").ok).toBe(true);
    expect(getProviderKey("trang")?.model).toBe("claude-haiku-5-5");
  });
});

describe("workspace riêng: hội thoại", () => {
  it("chưa có key (Lan) thì không chat được", () => {
    expect(sendTurn("lan", undefined, "Xin chào")).toEqual({ ok: false, error: "no-key" });
  });

  it("câu hỏi đầu tạo hội thoại mới, đặt tên theo câu hỏi", () => {
    const r = sendTurn("trang", undefined, "Kiểm thử đột biến đo bằng gì?");
    expect(r.ok && r.value.title).toBe("Kiểm thử đột biến đo bằng gì?");
    expect(r.ok && r.value.turns.map((t) => t.role)).toEqual(["user", "assistant"]);
    expect(getConversations("trang")[0].id).toBe(r.ok ? r.value.id : "");
  });

  it("hỏi tiếp thì nối vào cùng hội thoại", () => {
    const r = sendTurn("trang", "c1", "Còn hướng 2?");
    expect(r.ok && r.value.turns).toHaveLength(6);
  });

  it("không ghi được vào hội thoại của người khác", () => {
    saveProviderKey({ userId: "lan", provider: "anthropic", apiKey: "sk-ant-abcdefghijklmn7x2q" });
    expect(sendTurn("lan", "c1", "xem trộm")).toEqual({ ok: false, error: "not-found" });
    expect(getConversation("c1", "lan")).toBeUndefined();
  });
});

describe("highlight", () => {
  // Trang vào workspace chung bằng mã rồi Lan duyệt, như kịch bản demo.
  const joinTrang = () => decideJoinRequest(joinByCode("trang", getJoinCode("do-an")!.code).id, "lan", true);
  const post = (userId: string, text: string, highlightIds: string[] = []) =>
    postChannelMessage({ workspaceId: "do-an", channelId: "chung", userId, text, highlightIds });

  it("chỉ highlight được trong hội thoại của mình; xóa hội thoại thì highlight vẫn còn", () => {
    expect(addHighlight({ userId: "lan", conversationId: "c1", turnId: "c1-2", text: "x", label: "important" }).ok).toBe(false);
    const h = addHighlight({
      userId: "trang",
      conversationId: "c1",
      turnId: "c1-2",
      text: "  Hướng 1  có số đo ",
      label: "important",
    });
    expect(h.ok && h.value.text).toBe("Hướng 1 có số đo");
    deleteConversation("trang", "c1");
    expect(getHighlights("trang").some((x) => h.ok && x.id === h.value.id)).toBe(true);
  });

  it("chưa là thành viên thì không gửi được vào kênh chung", () => {
    expect(post("trang", "", ["h1"])).toEqual({ ok: false, error: "forbidden" });
  });

  it("vào rồi thì gửi highlight thành thẻ trích dẫn", () => {
    joinTrang();
    const r = post("trang", "", ["h1"]);
    expect(r.ok && r.value[0].attachment).toEqual({ type: "highlight", highlightId: "h1" });
  });

  it("không gửi được highlight của người khác", () => {
    expect(post("lan", "", ["h1"])).toEqual({ ok: false, error: "empty" });
  });

  it("agent được gọi nhắc rằng highlight là ý chưa chốt", () => {
    joinTrang();
    post("trang", "", ["h1"]);
    const r = post("lan", "@critic xem đoạn Trang gửi");
    const reply = r.ok ? r.value.find((m) => m.senderKind === "agent") : undefined;
    expect(reply?.body.map((b) => (b.t === "text" ? b.v : "")).join("")).toContain("chưa chốt");
  });

  it("lệnh tổng hợp chỉ dành cho chủ workspace", () => {
    joinTrang();
    const r = post("trang", "/brief");
    expect(r.ok && r.value.some((m) => m.senderKind === "system")).toBe(true);
    const own = post("lan", "/brief");
    expect(own.ok && own.value.some((m) => m.senderKind === "system")).toBe(false);
  });

  it("không đưa lên bảng highlight chưa được gửi vào workspace đó", () => {
    expect(promoteHighlight("do-an", "h1", "lan")).toEqual({ ok: false, error: "not-found" });
  });

  it("chỉ chủ đưa highlight lên bảng, ở cột đề xuất, giữ nguồn, không trùng", () => {
    joinTrang();
    post("trang", "", ["h1"]);
    expect(promoteHighlight("do-an", "h1", "trang")).toEqual({ ok: false, error: "forbidden" });
    const r = promoteHighlight("do-an", "h1", "lan");
    expect(r.ok && r.value.status).toBe("proposed");
    expect(r.ok && r.value.fromHighlight?.ownerId).toBe("trang");
    const again = promoteHighlight("do-an", "h1", "lan");
    expect(again.ok && r.ok && again.value.id).toBe(r.ok ? r.value.id : "");
    expect(isHighlightOnBoard("do-an", "h1")).toBe(true);
  });
});

describe("đăng ký bằng Google hoặc GitHub", () => {
  it("tài khoản mới: tạo hồ sơ và workspace riêng, chưa có key, chưa vào workspace chung", () => {
    const r = registerAccount({ provider: "google", login: "An@Gmail.com", displayName: "  An   Nguyễn " });
    expect(r.ok && r.value.created).toBe(true);
    const userId = r.ok ? r.value.userId : "";
    expect(getProfile(userId)).toMatchObject({ displayName: "An Nguyễn", initial: "A" });
    expect(getPersonalWorkspace(userId)?.members).toEqual([{ userId, role: "owner" }]);
    expect(getRail(userId).map((w) => w.kind)).toEqual(["personal"]);
    expect(getProviderKey(userId)).toBeUndefined();
    expect(findOAuthIdentity("google", "an@gmail.com")?.userId).toBe(userId);
  });

  it("tài khoản đã đăng ký thì đăng nhập vào hồ sơ cũ, không tạo trùng", () => {
    const r = registerAccount({ provider: "github", login: "LAN-PHAM", displayName: "Ai đó" });
    expect(r).toEqual({ ok: true, value: { userId: "lan", created: false } });
  });

  it("cùng người nhưng khác nhà cung cấp là hai tài khoản khác nhau", () => {
    const r = registerAccount({ provider: "google", login: "lan-pham@example.edu", displayName: "Lan" });
    expect(r.ok && r.value.created).toBe(true);
  });

  it.each([
    [{ provider: "github" as const, login: "-bad-", displayName: "X" }, "invalid-login"],
    [{ provider: "github" as const, login: "co dau cach", displayName: "X" }, "invalid-login"],
    [{ provider: "google" as const, login: "khong-phai-email", displayName: "X" }, "invalid-login"],
    [{ provider: "google" as const, login: "a@b.co", displayName: "   " }, "invalid-name"],
    [{ provider: "google" as const, login: "a@b.co", displayName: "x".repeat(41) }, "invalid-name"],
  ])("từ chối dữ liệu sai %#", (input, error) => {
    expect(registerAccount(input)).toEqual({ ok: false, error });
  });
});
