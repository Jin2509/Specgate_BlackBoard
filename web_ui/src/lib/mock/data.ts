// Dữ liệu giả của bản giao diện, giữ ở mức tối thiểu cho buổi demo:
// - Lan: chủ workspace chung "Đồ án Kiểm chứng" (đăng nhập bằng GitHub). Workspace riêng chưa có key.
// - Trang: tài khoản mới (đăng nhập bằng Google), chỉ có workspace riêng với một hội thoại và một highlight;
//   chưa vào workspace chung nào, để demo tham gia bằng mã KC26DAX rồi Lan duyệt.
// Số liệu ADOM ở giữa tệp là số thật của lượt MAIN, dùng cho các màn số liệu cho tới khi nhóm ADOM giao dữ liệu.
import type {
  Agent,
  BoardItem,
  Conversation,
  Criterion,
  Highlight,
  JoinCode,
  JoinRequest,
  Message,
  OAuthAccount,
  Profile,
  ProviderKey,
  RepairRow,
  Run,
  TaskResult,
  Workspace,
} from "@/lib/types";

export const profiles: Record<string, Profile> = {
  lan: { id: "lan", displayName: "Lan", initial: "L" },
  trang: { id: "trang", displayName: "Trang", initial: "T" },
};

export const oauthAccounts: OAuthAccount[] = [
  { provider: "github", userId: "lan", login: "lan-pham" },
  { provider: "google", userId: "trang", login: "trang@example.edu" },
];

function agent(
  id: string,
  handle: string,
  role: Agent["role"],
  model: string,
  systemPrompt: string,
  over: Partial<Agent> = {},
): Agent {
  return {
    id,
    handle,
    role,
    provider: role === "generator" ? "Anthropic" : "OpenAI-compatible",
    model,
    systemPrompt,
    keyLast4: "k3f9",
    budgetUsd: 5,
    spentUsd: 0,
    enabled: true,
    ...over,
  };
}

// Ba agent của workspace chung, dùng key của chủ workspace (Lan).
export const agents: Record<string, Agent> = {
  "gen-da": agent(
    "gen-da",
    "generator",
    "generator",
    "claude-sonnet-5-5",
    "Đề xuất ý mới bám theo đề bài và ràng buộc. Mỗi ý một câu. Không đề xuất lại ý đã loại.",
    { spentUsd: 0.64 },
  ),
  "critic-da": agent(
    "critic-da",
    "critic",
    "critic",
    "gpt-6-luna",
    "Tìm điểm yếu của ý đang bàn theo ràng buộc trong đề bài. Nêu tối đa ba điểm, mỗi điểm một câu. Không đề xuất ý mới.",
    { spentUsd: 4.86 },
  ),
  "synth-da": agent(
    "synth-da",
    "synth",
    "synthesizer",
    "qwen-3.8-max",
    "Tóm tắt phần đã bàn: ý nào đã chốt, đã loại, còn mở. Không thêm ý của riêng mình.",
    { spentUsd: 0.12, budgetUsd: 2 },
  ),
};

function personal(userId: string, name: string): Workspace {
  return {
    id: `rieng-${userId}`,
    name: `Của riêng ${name}`,
    short: name.slice(0, 1),
    kind: "personal",
    visibility: "hidden",
    ownerId: userId,
    brief: "",
    modules: [],
    members: [{ userId, role: "owner" }],
    channels: [],
    agentIds: [],
  };
}

export const workspaces: Record<string, Workspace> = {
  "rieng-lan": personal("lan", "Lan"),
  "rieng-trang": personal("trang", "Trang"),
  "do-an": {
    id: "do-an",
    name: "Đồ án Kiểm chứng",
    short: "ĐA",
    kind: "shared",
    visibility: "discoverable",
    ownerId: "lan",
    brief: "Chọn đề tài đồ án môn Kiểm chứng phần mềm. Làm được trong 3 tuần, 2 người, có phần kiểm thử đo đếm được.",
    modules: [],
    members: [{ userId: "lan", role: "owner" }],
    channels: [
      { id: "chung", name: "chung" },
      { id: "phan-bien", name: "phan-bien" },
    ],
    agentIds: ["gen-da", "critic-da", "synth-da"],
  },
};

// Mã tham gia hiện hành; chủ đổi mã thì mã cũ hết hiệu lực.
export const joinCodes: JoinCode[] = [{ code: "KC26DAX", workspaceId: "do-an", createdBy: "lan", createdAt: "12/11 08:30" }];

export const joinRequests: JoinRequest[] = [];

export const messages: Record<string, Message[]> = {
  "do-an/chung": [
    {
      id: "d1",
      channelId: "chung",
      senderKind: "human",
      senderId: "lan",
      at: "14:00",
      body: [
        { t: "mention", v: "generator" },
        { t: "text", v: " gợi ý hai hướng đề tài có số đo rõ, mỗi hướng một câu." },
      ],
    },
    {
      id: "d2",
      channelId: "chung",
      senderKind: "agent",
      senderId: "gen-da",
      at: "14:00",
      body: [],
      list: [
        "Công cụ so sánh độ phủ giữa test do người viết và test do LLM sinh.",
        "Kiểm thử dựa trên thuộc tính cho bộ phân tích biểu thức cron.",
      ],
    },
    {
      id: "d3",
      channelId: "chung",
      senderKind: "human",
      senderId: "lan",
      at: "14:02",
      body: [
        { t: "text", v: "Hướng 2 nghe hợp. " },
        { t: "mention", v: "critic" },
        { t: "text", v: " phản biện giúp, bám theo ràng buộc trong đề bài." },
      ],
    },
    {
      id: "d4",
      channelId: "chung",
      senderKind: "agent",
      senderId: "critic-da",
      at: "14:02",
      body: [
        {
          t: "text",
          v: "Hai điểm yếu. Một: cần chốt trước số đo là số bất biến hay số phản ví dụ. Hai: dự án cron nhỏ có thể quá ít lỗi để so sánh. Điểm mạnh: dùng chung công cụ với ý đã chốt, tiết kiệm công dựng.",
        },
      ],
    },
  ],
};

export const boards: Record<string, BoardItem[]> = {
  "do-an": [
    {
      id: "i1",
      number: 1,
      kind: "idea",
      body: "Công cụ so sánh độ phủ giữa test do người viết và test do LLM sinh",
      status: "proposed",
      createdBy: { kind: "agent", id: "gen-da" },
      at: "14:00",
    },
    {
      id: "i2",
      number: 2,
      kind: "idea",
      body: "Kiểm thử dựa trên thuộc tính cho bộ phân tích biểu thức cron",
      status: "discussing",
      createdBy: { kind: "agent", id: "gen-da" },
      at: "14:00",
      critiques: 1,
      latestCritique: "cần chốt trước số đo là số bất biến hay số phản ví dụ.",
    },
    {
      id: "i3",
      number: 3,
      kind: "idea",
      body: "Kiểm thử đột biến cho bộ kiểm tra hợp lệ của biểu mẫu",
      status: "decided",
      reason: "Đo được bằng điểm đột biến, vừa 3 tuần.",
      createdBy: { kind: "human", id: "lan" },
      decidedBy: { id: "lan", at: "13:40" },
      at: "13:10",
    },
    {
      id: "i4",
      number: 4,
      kind: "idea",
      body: "Chứng minh hình thức một thuật toán sắp xếp bằng Coq",
      status: "rejected",
      reason: "Không ai trong nhóm biết Coq, không kịp.",
      createdBy: { kind: "agent", id: "gen-da" },
      decidedBy: { id: "lan", at: "13:22" },
      at: "13:05",
    },
    {
      id: "n1",
      number: 5,
      kind: "note",
      body: "Ràng buộc: 3 tuần, 2 người, phải có số đo.",
      createdBy: { kind: "human", id: "lan" },
      at: "13:00",
    },
    {
      id: "q1",
      number: 6,
      kind: "question",
      body: "Có được dùng thư viện bên ngoài để sinh đột biến không?",
      status: "open",
      createdBy: { kind: "human", id: "lan" },
      at: "13:45",
    },
    {
      id: "s1",
      number: 7,
      kind: "summary",
      body: "Đã chốt kiểm thử đột biến; đang cân nhắc thêm hướng thuộc tính để có phần so sánh. Đã loại Coq vì không kịp.",
      createdBy: { kind: "agent", id: "synth-da" },
      at: "14:03",
    },
  ],
};

export const runs: Run[] = [
  {
    id: "main",
    workspaceId: "adom",
    name: "MAIN",
    variants: ["A3-natural-standard", "A1-natural-standard"],
    primaryVariant: "A3-natural-standard",
    dataset: "HumanEval+",
    tasks: 162,
    tasksWithSpec: 159,
    violations: [277, 445],
    validity: "invalidated",
    invalidReason:
      "Engine đọc sai nhãn UniqueOutput nên chốt G4 và G6 không hoạt động trên 111/159 tác vụ. Không dùng các số dưới đây làm kết quả chính thức.",
    importedBy: "huy",
    importedAt: "20/11",
    models: [
      { role: "Coder", model: "claude-haiku-5.5" },
      { role: "Spec", model: "glm-5.3-flash" },
      { role: "Draft 1", model: "qwen-3.8-max" },
      { role: "Draft 2", model: "gpt-6-luna" },
      { role: "Judge", model: "deepseek-v4.1-flash" },
    ],
  },
];

export const criteria: Criterion[] = [
  {
    number: 1,
    title: "Tỷ lệ kết luận SPEC_FAULT sai",
    value: 0,
    display: "0.000",
    numerator: 0,
    denominator: 131,
    tasks: 10,
    ciLow: 0,
    ciHigh: 0.028,
    threshold: { op: "<=", value: 0.1 },
    footnote: "ngưỡng ≤ 0.10 · cận trên 0.028",
    verdict: "PASS",
  },
  {
    number: 2,
    title: "Bản sửa tổng quát gây hại",
    value: 0.357,
    display: "0.357",
    numerator: 5,
    denominator: 14,
    tasks: 8,
    ciLow: 0,
    ciHigh: 0.72,
    footnote: "khoảng [0.00, 0.72]",
    verdict: "INSUFFICIENT_DATA",
  },
  {
    number: 3,
    title: "Cổng chặn bản sửa nhầm bên",
    value: null,
    display: "n = 0",
    tasks: 0,
    footnote: "chưa gặp ca nhầm bên",
    verdict: "INSUFFICIENT_DATA",
  },
  {
    number: 4,
    title: "Ứng viên hạng 1 nới quá tay",
    value: 0.308,
    display: "0.308",
    numerator: 8,
    denominator: 26,
    tasks: 6,
    ciLow: 0,
    ciHigh: 0.82,
    footnote: "khoảng [0.00, 0.82]",
    verdict: "INSUFFICIENT_DATA",
  },
  {
    number: 5,
    title: "Tỷ lệ bản sửa tốt",
    value: 0.667,
    display: "0.667",
    numerator: 18,
    denominator: 27,
    tasks: 7,
    ciLow: 0.17,
    ciHigh: 0.96,
    threshold: { op: ">=", value: 0.3 },
    footnote: "ngưỡng ≥ 0.30 · cận dưới 0.17",
    verdict: "INSUFFICIENT_DATA",
  },
  {
    number: 6,
    title: "Ít gây hại hơn hai baseline",
    value: 0,
    display: "0.000",
    tasks: 7,
    footnote: "27 vi phạm, chưa đủ 10 tác vụ",
    verdict: "INSUFFICIENT_DATA",
  },
];

export const repairRows: RepairRow[] = [
  { method: "rules (ADOM)", good: 18, wrongSide: 0, overRelax: 8, unmeasured: 104, noCandidate: 1, notRepaired: 0 },
  { method: "llm_judge", good: 17, wrongSide: 0, overRelax: 8, unmeasured: 104, noCandidate: 1, notRepaired: 1 },
  { method: "always_spec", good: 18, wrongSide: 0, overRelax: 8, unmeasured: 104, noCandidate: 1, notRepaired: 0 },
];

export const taskResults: TaskResult[] = [
  { taskId: "HumanEval/38", violations: 118, share: 42.6, a3State: "AGREE", contributing: true, wallSeconds: 1296 },
  { taskId: "HumanEval/93", violations: 23, share: 8.3, a3State: "AGREE", contributing: true, wallSeconds: 41 },
  { taskId: "HumanEval/140", violations: 19, share: 6.9, a3State: "AGREE", contributing: true, wallSeconds: 37 },
  { taskId: "HumanEval/120", violations: 16, share: 5.8, a3State: "AGREE", contributing: true, wallSeconds: 22 },
  { taskId: "HumanEval/161", violations: 16, share: 5.8, a3State: "DISAGREE", contributing: false, wallSeconds: 19 },
  { taskId: "HumanEval/1", violations: 15, share: 5.4, a3State: "AGREE", contributing: true, wallSeconds: 28 },
  { taskId: "HumanEval/133", violations: 13, share: 4.7, a3State: "AGREE", contributing: true, wallSeconds: 17 },
  { taskId: "HumanEval/137", violations: 13, share: 4.7, a3State: "SINGLE", contributing: false, wallSeconds: 15 },
];

export const draftAgreement = [
  { label: "Đồng thuận", code: "AGREE", value: 157 },
  { label: "Chỉ một bản qua lọc", code: "SINGLE", value: 3 },
  { label: "Bất đồng", code: "DISAGREE", value: 2 },
  { label: "Không có spec dùng được", code: "no_spec", value: 3 },
];

export const runCost = [
  { variant: "A1", seconds: 1718, apiCalls: 106, cacheHits: 25 },
  { variant: "A3", seconds: 523, apiCalls: 0, cacheHits: 131 },
];

export const criterionAnnotations: Record<number, string[]> = {};

// Workspace riêng: chỉ Trang có key, một hội thoại và một highlight. Lan chưa nhập key để demo màn nhập key.
export const providerKeys: ProviderKey[] = [
  {
    userId: "trang",
    provider: "anthropic",
    keyLast4: "a21c",
    model: "claude-sonnet-5-5",
    models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
    savedAt: "10/11 21:40",
  },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    ownerId: "trang",
    title: "Hướng kiểm thử cho đồ án",
    updatedAt: "12/11 09:16",
    turns: [
      {
        id: "c1-1",
        role: "user",
        at: "09:12",
        text: "Mình cần vài hướng kiểm thử cho đồ án môn Kiểm chứng, làm trong 3 tuần, 2 người. Gợi ý ba hướng, mỗi hướng một câu.",
      },
      {
        id: "c1-2",
        role: "assistant",
        model: "claude-sonnet-5-5",
        at: "09:12",
        text: "Ba hướng vừa sức 3 tuần:\n\n1. Kiểm thử đột biến: đo chất lượng bộ test có sẵn bằng tỷ lệ đột biến bị bắt.\n2. Kiểm thử dựa trên thuộc tính: phát biểu bất biến, để công cụ tự sinh đầu vào và tìm phản ví dụ.\n3. Kiểm thử hợp đồng API: sinh ca thử từ đặc tả OpenAPI của một dịch vụ mã nguồn mở.\n\nHướng 1 có số đo rõ nhất. Hướng 3 dễ mất thời gian dọn đặc tả trước khi kiểm thử được.",
      },
      {
        id: "c1-3",
        role: "user",
        at: "09:15",
        text: "Hướng 3 nếu làm thì cần chuẩn bị gì?",
      },
      {
        id: "c1-4",
        role: "assistant",
        model: "claude-sonnet-5-5",
        at: "09:16",
        text: "Cần một dịch vụ có đặc tả OpenAPI đầy đủ và chạy được trên máy. Rủi ro chính: đặc tả thường lệch với hành vi thật, nên một phần lỗi tìm được là lỗi của đặc tả chứ không phải của dịch vụ. Nên quyết định trước sẽ đếm hai loại này riêng hay chung.",
      },
    ],
  },
];

export const highlights: Highlight[] = [
  {
    id: "h1",
    ownerId: "trang",
    conversationId: "c1",
    turnId: "c1-4",
    text: "Rủi ro chính: đặc tả thường lệch với hành vi thật, nên một phần lỗi tìm được là lỗi của đặc tả chứ không phải của dịch vụ.",
    label: "review",
    at: "12/11 09:17",
  },
];
