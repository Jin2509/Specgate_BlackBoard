// Test luồng Script2 (mã tham gia, duyệt), workspace riêng (key, hội thoại) và mô hình ngữ cảnh của trưởng nhóm
// (agent riêng gửi vào kênh, highlight trong kênh, agent đọc tin của chủ và đoạn đã highlight).
import { beforeEach, describe, expect, it } from "vitest";
import {
  addHighlight,
  cancelJoinRequest,
  chooseModel,
  decideJoinRequest,
  deleteConversation,
  linkConversation,
  postAgentReply,
  postChannelMessage,
  registerAccount,
  rotateJoinCode,
  saveProviderKey,
  sendTurn,
  setTeamRole,
  submitJoinRequest,
} from "./mutations";
import {
  findOAuthIdentity,
  getAgentContext,
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
  getMessages,
  getRail,
  getWorkspace,
  speakerLabel,
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
  it("chưa có key thì không chat được", () => {
    const r = registerAccount({ provider: "google", login: "moi@example.edu", displayName: "Mới" });
    expect(sendTurn(r.ok ? r.value.userId : "", undefined, "Xin chào")).toEqual({ ok: false, error: "no-key" });
  });

  it("câu hỏi đầu tạo hội thoại mới, đặt tên theo câu hỏi", () => {
    const r = sendTurn("trang", undefined, "Kiểm thử đột biến đo bằng gì?");
    expect(r.ok && r.value.title).toBe("Kiểm thử đột biến đo bằng gì?");
    expect(r.ok && r.value.turns.map((t) => t.role)).toEqual(["user", "assistant"]);
    expect(getConversations("trang")[0].id).toBe(r.ok ? r.value.id : "");
  });

  it("hỏi tiếp thì nối vào cùng hội thoại", () => {
    const r = sendTurn("trang", "c1", "Còn hướng 2?");
    expect(r.ok && r.value.turns).toHaveLength(4);
  });

  it("không ghi được vào hội thoại của người khác", () => {
    expect(sendTurn("lan", "c1", "xem trộm")).toEqual({ ok: false, error: "not-found" });
    expect(getConversation("c1", "lan")).toBeUndefined();
  });
});

describe("agent riêng gửi vào kênh chung", () => {
  it("câu trả lời hiện trong kênh dưới tên agent của người gửi", () => {
    const r = postAgentReply({
      userId: "lan",
      conversationId: "c-lan",
      turnId: "c-lan-4",
      channelId: "chung",
      text: "Nên đặt 120 giây.",
    });
    expect(r.ok && r.value).toMatchObject({ senderKind: "agent", senderId: "lan", agentModel: "claude-sonnet-5-5" });
    expect(speakerLabel(getMessages("do-an", "chung").at(-1)!)).toBe("claude-sonnet-5-5 của Lan");
  });

  it("chỉ gửi được câu trả lời của agent, trong hội thoại của mình, đã gắn workspace chung", () => {
    const base = { conversationId: "c-lan", channelId: "chung", text: "x" };
    expect(postAgentReply({ ...base, userId: "lan", turnId: "c-lan-1" })).toEqual({ ok: false, error: "not-found" });
    expect(postAgentReply({ ...base, userId: "long", turnId: "c-lan-4" })).toEqual({ ok: false, error: "not-found" });
    expect(postAgentReply({ userId: "trang", conversationId: "c1", turnId: "c1-2", channelId: "chung", text: "x" })).toEqual({
      ok: false,
      error: "not-linked",
    });
  });

  it("chỉ gắn được hội thoại với workspace mình là thành viên", () => {
    expect(linkConversation("trang", "c1", "do-an")).toEqual({ ok: false, error: "forbidden" });
    expect(linkConversation("lan", "c-lan", undefined).ok).toBe(true);
    expect(getConversation("c-lan", "lan")?.workspaceId).toBeUndefined();
  });

  it("kênh không có agent tự trả lời khi được nhắc tên", () => {
    const r = postChannelMessage({ workspaceId: "do-an", channelId: "chung", userId: "lan", text: "@Long xem giúp" });
    expect(r.ok && r.value.map((m) => m.senderKind)).toEqual(["human"]);
  });

  it("lệnh tổng hợp chỉ dành cho chủ workspace", () => {
    const post = (userId: string) => postChannelMessage({ workspaceId: "do-an", channelId: "chung", userId, text: "/brief" });
    const r = post("long");
    expect(r.ok && r.value.some((m) => m.senderKind === "system")).toBe(true);
    const own = post("lan");
    expect(own.ok && own.value.some((m) => m.senderKind === "system")).toBe(false);
  });
});

describe("highlight trong kênh chung", () => {
  const hl = (userId: string, messageId: string, text = "mutmut") =>
    addHighlight({ userId, workspaceId: "do-an", channelId: "chung", messageId, text, label: "important" });

  it("highlight tin của người khác lưu bản chụp và người nói", () => {
    const r = hl("long", "d2", "  Công cụ   sinh đột biến ");
    expect(r.ok && r.value.text).toBe("Công cụ sinh đột biến");
    expect(r.ok && r.value.author).toEqual({ kind: "agent", userId: "lan", model: "claude-sonnet-5-5" });
    expect(getHighlights("long", "do-an")).toHaveLength(1);
    expect(getHighlights("lan", "do-an").some((h) => r.ok && h.id === r.value.id)).toBe(false);
  });

  it("không highlight tin của mình hoặc của agent mình: những tin đó đã tự vào ngữ cảnh", () => {
    expect(hl("lan", "d1")).toEqual({ ok: false, error: "own-message" });
    expect(hl("lan", "d2")).toEqual({ ok: false, error: "own-message" });
  });

  it("chưa là thành viên thì không highlight được", () => {
    expect(hl("trang", "d3")).toEqual({ ok: false, error: "forbidden" });
  });
});

describe("ngữ cảnh agent riêng", () => {
  it("gồm đội kèm vai và agent, tin của chính mình, và đoạn đã highlight kèm người nói", () => {
    const ctx = getAgentContext("lan", "do-an")!;
    expect(ctx.team.map((m) => [m.profile.displayName, m.teamRole, m.agent?.model])).toEqual([
      ["Lan", "Dựng khung", "claude-sonnet-5-5"],
      ["Long", "Runner", "deepseek-v4"],
    ]);
    expect(ctx.ownMessages.map((m) => m.speaker)).toEqual(["Lan", "claude-sonnet-5-5 của Lan"]);
    expect(ctx.highlights.map((h) => h.speaker)).toEqual(["deepseek-v4 của Long", "Long"]);
    expect(ctx.decided.length).toBeGreaterThan(0);
  });

  it("không có tin của người khác trừ khi đã highlight", () => {
    const ctx = getAgentContext("long", "do-an")!;
    expect(ctx.ownMessages.every((m) => m.speaker.includes("Long"))).toBe(true);
    expect(ctx.highlights).toEqual([]);
  });

  it("agent trả lời nêu được ai đã nói đoạn đã highlight", () => {
    const r = sendTurn("lan", "c-lan", "Tóm lại giúp");
    const answer = r.ok ? r.value.turns.at(-1)!.text : "";
    expect(answer).toContain("Long (Runner)");
    expect(answer).toContain('Long nói: "60 giây');
    expect(answer).toContain("deepseek-v4 của Long nói");
  });

  it("xóa hội thoại riêng không làm mất highlight", () => {
    deleteConversation("lan", "c-lan");
    expect(getHighlights("lan")).toHaveLength(2);
  });

  it("mỗi người tự đặt vai của mình trong nhóm; người ngoài không đặt được", () => {
    expect(setTeamRole("long", "do-an", "  Runner   chính ").ok).toBe(true);
    expect(getWorkspace("do-an")!.members.find((m) => m.userId === "long")?.teamRole).toBe("Runner chính");
    expect(setTeamRole("trang", "do-an", "x")).toEqual({ ok: false, error: "forbidden" });
  });

  it("thành viên mới vào bằng mã thì gắn hội thoại được", () => {
    decideJoinRequest(joinByCode("trang", getJoinCode("do-an")!.code).id, "lan", true);
    expect(linkConversation("trang", "c1", "do-an").ok).toBe(true);
    expect(getAgentContext("trang", "do-an")?.team).toHaveLength(3);
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
