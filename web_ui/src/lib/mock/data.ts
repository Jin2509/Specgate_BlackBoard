// Dữ liệu giả của bản giao diện, dựng theo kịch bản của trưởng nhóm:
// - Lan (GitHub): chủ workspace chung "Đồ án Kiểm chứng", vai "Dựng khung", agent riêng là Claude.
// - Long (GitHub): thành viên, vai "Runner", agent riêng là DeepSeek.
//   Agent của Lan đã gửi các điểm cần thống nhất vào #chung, agent của Long trả lời, Long nhắn thêm một ý.
//   Lan highlight hai đoạn của Long; hội thoại riêng của Lan (gắn với workspace chung) đọc được hai đoạn đó.
// - Trang (Google): tài khoản mới, có key và một hội thoại riêng, chưa vào workspace chung nào,
//   để demo tham gia bằng mã KC26DAX rồi Lan duyệt.
// Số liệu ADOM ở giữa tệp là số thật của lượt MAIN, dùng cho các màn số liệu cho tới khi nhóm ADOM giao dữ liệu.
import type {
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
  long: { id: "long", displayName: "Long", initial: "L" },
  trang: { id: "trang", displayName: "Trang", initial: "T" },
};

export const oauthAccounts: OAuthAccount[] = [
  { provider: "github", userId: "lan", login: "lan-pham" },
  { provider: "github", userId: "long", login: "long-tran" },
  { provider: "google", userId: "trang", login: "trang@example.edu" },
];

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
  };
}

export const workspaces: Record<string, Workspace> = {
  "rieng-lan": personal("lan", "Lan"),
  "rieng-long": personal("long", "Long"),
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
    members: [
      { userId: "lan", role: "owner", teamRole: "Dựng khung" },
      { userId: "long", role: "member", teamRole: "Runner" },
    ],
    channels: [
      { id: "chung", name: "chung" },
      { id: "phan-bien", name: "phan-bien" },
    ],
  },
};

// Mã tham gia hiện hành; chủ đổi mã thì mã cũ hết hiệu lực.
export const joinCodes: JoinCode[] = [{ code: "KC26DAX", workspaceId: "do-an", createdBy: "lan", createdAt: "12/11 08:30" }];

export const joinRequests: JoinRequest[] = [];

const LAN_QUESTIONS = [
  "Công cụ sinh đột biến: dùng thư viện có sẵn (mutmut) hay tự viết?",
  "Mỗi lượt chạy đột biến tối đa bao lâu? 60 giây một tệp có đủ không?",
  "Kết quả ghi theo từng đột biến hay gộp theo tệp?",
];

const LONG_ANSWERS = [
  "Dùng mutmut, tự viết không kịp 3 tuần.",
  "60 giây đủ cho phần lớn tệp; tệp quá giờ ghi là timeout, không chạy lại.",
  "Ghi theo từng đột biến, gộp sau bằng script.",
];

export const messages: Record<string, Message[]> = {
  "do-an/chung": [
    {
      id: "d1",
      channelId: "chung",
      senderKind: "human",
      senderId: "lan",
      at: "14:00",
      body: [
        { t: "text", v: "Đã chốt kiểm thử đột biến. Mình dựng khung, " },
        { t: "mention", v: "Long" },
        { t: "text", v: " chạy. Agent của mình có mấy điểm cần runner trả lời, mình gửi vào đây." },
      ],
    },
    {
      id: "d2",
      channelId: "chung",
      senderKind: "agent",
      senderId: "lan",
      agentModel: "claude-sonnet-5-5",
      at: "14:01",
      body: [{ t: "text", v: "Điểm cần thống nhất với runner:" }],
      list: [...LAN_QUESTIONS, "Kết thúc các câu hỏi."],
    },
    {
      id: "d3",
      channelId: "chung",
      senderKind: "agent",
      senderId: "long",
      agentModel: "deepseek-v4",
      at: "14:06",
      body: [{ t: "text", v: "Các điểm cần thống nhất, khuyến nghị từ phía runner:" }],
      list: LONG_ANSWERS,
    },
    {
      id: "d4",
      channelId: "chung",
      senderKind: "human",
      senderId: "long",
      at: "14:07",
      body: [
        {
          t: "text",
          v: "Bổ sung câu 2: 60 giây là mình đo trên máy mình, máy chấm của thầy chậm hơn khoảng gấp đôi.",
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
      createdBy: { kind: "agent", id: "lan" },
      at: "14:00",
    },
    {
      id: "i2",
      number: 2,
      kind: "idea",
      body: "Kiểm thử dựa trên thuộc tính cho bộ phân tích biểu thức cron",
      status: "discussing",
      createdBy: { kind: "agent", id: "lan" },
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
      createdBy: { kind: "agent", id: "lan" },
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
      createdBy: { kind: "agent", id: "lan" },
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

// Workspace riêng: Lan và Long có key, mỗi người một agent. Trang có key và một hội thoại chưa gắn workspace chung.
// Tài khoản đăng ký mới chưa có key, dùng để demo màn nhập key.
export const providerKeys: ProviderKey[] = [
  {
    userId: "lan",
    provider: "anthropic",
    keyLast4: "k3f9",
    model: "claude-sonnet-5-5",
    models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
    savedAt: "10/11 20:05",
  },
  {
    userId: "long",
    provider: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    keyLast4: "d7e2",
    model: "deepseek-v4",
    models: ["gpt-6-luna", "qwen-3.8-max", "deepseek-v4"],
    savedAt: "11/11 08:12",
  },
  {
    userId: "trang",
    provider: "anthropic",
    keyLast4: "a21c",
    model: "claude-sonnet-5-5",
    models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
    savedAt: "10/11 21:40",
  },
];

const numbered = (items: string[]) => items.map((q, i) => `${i + 1}. ${q}`).join("\n");

export const conversations: Conversation[] = [
  {
    id: "c-lan",
    ownerId: "lan",
    workspaceId: "do-an",
    title: "Thống nhất với runner",
    updatedAt: "12/11 14:12",
    turns: [
      {
        id: "c-lan-1",
        role: "user",
        at: "13:58",
        text: "Mình dựng khung cho đồ án kiểm thử đột biến, Long là runner chạy thí nghiệm. Liệt kê các điểm mình cần thống nhất với runner trước khi chạy.",
      },
      {
        id: "c-lan-2",
        role: "assistant",
        model: "claude-sonnet-5-5",
        at: "13:59",
        text: `Điểm cần thống nhất với runner:\n\n${numbered(LAN_QUESTIONS)}\n\nKết thúc các câu hỏi.`,
      },
      {
        id: "c-lan-3",
        role: "user",
        at: "14:11",
        text: "Runner đã trả lời, mình highlight hai đoạn trong kênh. Phản biện giúp.",
      },
      {
        id: "c-lan-4",
        role: "assistant",
        model: "claude-sonnet-5-5",
        at: "14:12",
        text: "Mình đọc hai đoạn bạn highlight ở #chung:\n\n1. DeepSeek của Long khuyên dùng mutmut vì tự viết không kịp 3 tuần. Đồng ý. Cần hỏi thầy trước, vì trên bảng vẫn còn câu hỏi mở về việc dùng thư viện ngoài.\n2. Long nói 60 giây là đo trên máy của Long, còn máy chấm chậm hơn khoảng gấp đôi. Long nói đúng nếu kết quả chính thức chạy trên máy chấm. Nên đặt 120 giây, hoặc đo lại một tệp trên máy chấm rồi mới chốt.\n\nCâu 3 runner đã trả lời đúng ý khung, không cần bàn thêm.",
      },
    ],
  },
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
    ],
  },
];

// Highlight của Lan trong #chung: một đoạn của agent của Long, một đoạn Long tự nhắn.
export const highlights: Highlight[] = [
  {
    id: "h1",
    ownerId: "lan",
    workspaceId: "do-an",
    channelId: "chung",
    messageId: "d3",
    author: { kind: "agent", userId: "long", model: "deepseek-v4" },
    text: LONG_ANSWERS[0],
    label: "important",
    at: "12/11 14:09",
  },
  {
    id: "h2",
    ownerId: "lan",
    workspaceId: "do-an",
    channelId: "chung",
    messageId: "d4",
    author: { kind: "human", userId: "long" },
    text: "60 giây là mình đo trên máy mình, máy chấm của thầy chậm hơn khoảng gấp đôi.",
    label: "review",
    at: "12/11 14:10",
  },
];
