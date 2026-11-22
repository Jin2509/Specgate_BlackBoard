# SpecGate Workspace: checklist định hướng đồ án

Cập nhật: 21/11/2026 (mục 2, 3, 6 đối chiếu lại với website đang chạy và SRS 0.4; mục 4, 5 giữ như bản 17/11).

Tệp này đối chiếu dự án với **bảng tiêu chí chấm** (`Checklist.xls`, mẫu "Check list cho project Maintenance", thang 1–5) và với `docs/SRS.md`, `docs/SPRINT_PLAN.md`. Mỗi mục có trạng thái:

- `[x]` đã có, có bằng chứng (file, test, lệnh)
- `[~]` có một phần, cần bổ sung
- `[ ]` chưa có

## Mục lục

1. [Bảng tiêu chí chấm và ý nghĩa với dự án](#1-bảng-tiêu-chí-chấm-và-ý-nghĩa-với-dự-án)
2. [Hiện trạng: chức năng so với SRS](#2-hiện-trạng-chức-năng-so-với-srs)
3. [Hiện trạng: phi chức năng](#3-hiện-trạng-phi-chức-năng)
4. [Chỗ thực tế đã lệch kế hoạch sprint](#4-chỗ-thực-tế-đã-lệch-kế-hoạch-sprint)
5. [Kế hoạch còn lại (viết lại)](#5-kế-hoạch-còn-lại-viết-lại)
6. [Checklist theo tiêu chí chấm](#6-checklist-theo-tiêu-chí-chấm)
7. [Tự chấm dự kiến](#7-tự-chấm-dự-kiến)

---

## 1. Bảng tiêu chí chấm và ý nghĩa với dự án

Bảng mẫu (nhóm Football Manager, 52 điểm) cho thấy giáo viên trừ điểm ở đâu. Những chỗ họ bị 0–2 điểm là chỗ nhóm mình phải tránh:

| Nhóm tiêu chí | Tiêu chí | Lý do nhóm mẫu bị trừ | Việc nhóm mình cần chứng minh |
|---|---|---|---|
| 1. Source code | Độ phức tạp, dễ đọc, code standard, **cài đặt chương trình**, dễ bảo trì | Thiếu một lớp của mô hình 3 lớp; **không có cài đặt** (0đ) | Kiến trúc phân lớp rõ; có cách cài một lệnh và hướng dẫn cài |
| 2. Chạy ứng dụng | **Loại ứng dụng/platform**, chạy ổn định, **chức năng đầy đủ**, giao diện, **lỗi chương trình**, hiệu năng | Platform 0đ; thiếu chức năng, **không có file báo cáo**; thêm/sửa đều báo lỗi (1đ) | Nêu rõ platform; đủ FR Must; xuất được báo cáo; kịch bản khói không lỗi |
| 3. Sưu liệu | Độ phức tạp, dễ đọc, **document standard**, đặc tả chức năng/hệ thống/dữ liệu/giao diện, **user guide, cài đặt** | Thiếu **mục lục**; không có file hướng dẫn sử dụng | Tài liệu có mục lục, đặc tả đủ 4 mặt, có User Guide và Installation Guide riêng |
| 4. Kiểm thử | **Vận dụng các loại kiểm thử**, **công cụ** | Chỉ test tay; không dùng tool (0đ) | Nhiều loại kiểm thử, có công cụ tự động và báo cáo |
| 5. Tools | Tools phát triển, **kiểm soát bug**, **kiểm soát report**, **quản lý cấu hình** | Ba mục cuối 0đ | Issue tracker, báo cáo test/độ phủ tự sinh, Git + branch + PR + CI |
| 6. Quy trình | (giáo viên chấm) | – | Bằng chứng Scrum: sprint plan, họp, demo mốc, nhìn lại |
| 7. Phối hợp làm việc | (giáo viên chấm) | – | Phân công, PR review chéo, lịch sử commit của cả hai người |
| 8. Phản hồi khách hàng | (giáo viên chấm) | – | Ghi nhận phản hồi của trưởng nhóm/người dùng và thay đổi đã làm theo |

**Kết luận:** điểm dễ mất nhất không nằm ở chức năng (dự án đã khá đủ) mà ở **cài đặt, user guide, công cụ kiểm thử/bug/report/cấu hình, quy trình và phối hợp**. Kế hoạch còn lại ưu tiên các mục này.

---

## 2. Hiện trạng: chức năng so với SRS

Kiểm bằng cách đọc code (`backend/app/ws/`, `web_ui/src/features/`) và chạy test ngày 21/11 trên nhánh `dev`: **backend 103 test đạt**; **frontend Vitest 54 test đạt (17 tệp)**. Mã FR, UC theo [SRS 0.4](SRS.md).

### 2.1. Tài khoản và Trang chủ (UC01, UC02)

- [x] FR-01 Bảo vệ route, quay lại đúng trang (`web_ui/src/proxy.ts`)
- [x] FR-02 Ba cách đăng nhập: Google, GitHub (`routers/auth.py`: `/{provider}/start`, `/callback`) và mã email
- [x] FR-03, FR-04 Lần đầu tạo tài khoản + workspace riêng; không tạo trùng (`upsert_identity`)
- [x] FR-05, FR-06 Đăng xuất (`DELETE /api/v1/auth/session`); phiên 30 ngày trượt (`GET /auth/session`)
- [x] FR-111 – FR-114 Đăng nhập bằng mã email: `POST /auth/email-codes`, `POST /auth/email-sessions`, `app/ws/email_codes.py`, `app/ws/mailer.py`, `EmailSignInForm.tsx`; test `test_ws_email_sign_in.py` (16)
- [x] FR-115 Màn giả lập bắt xác thực email khi tạo tài khoản (`SignUpForm.tsx`, `dev-sessions` với `code`)
- [x] FR-07 – FR-09 Trang chủ, dấu báo thanh bên và kênh (`use-workspace-badges.ts`, `channel-dot.ts`)
- [~] OAuth thật chỉ chạy khi cấu hình client id/secret; demo đang dùng màn giả lập (`AUTH_DEV_LOGIN`). Đăng nhập bằng email cần cấu hình SMTP trên server demo. **Cần cấu hình OAuth thật và SMTP trên server demo.**

### 2.2. Workspace riêng (UC03 – UC05)

- [x] FR-10 – FR-14 Anthropic, kiểu OpenAI; kiểm key; lỗi tiếng Việt; chỉ hiện 4 ký tự cuối (`providers.py`, `KeyForm.tsx`)
- [x] FR-116 Gợi ý địa chỉ (OpenAI, Google Gemini, OpenRouter, DeepSeek, Groq); lọc mô hình không chat được (`test_ws_providers.py`)
- [x] FR-15 – FR-23 Chat stream, dừng, tạo lại có phiên bản, đổi tên, xóa hội thoại có hỏi giữ highlight
- [x] FR-24 – FR-30 Highlight riêng: màu, ghi chú, lọc, sửa, dọn dẹp

### 2.3. Ngữ cảnh nhóm và riêng sang chung (UC06 – UC08)

- [x] FR-31 – FR-41 Ngữ cảnh nhóm, khung "Agent đang đọc", tóm tắt tin cũ theo khối (`context.py`)
- [x] FR-42 – FR-49 Gửi highlight riêng vào kênh từ danh sách và bằng `@`, ba mức trung thực
- [x] FR-50 – FR-53 "Tóm tắt cho nhóm" (bản tối thiểu)

### 2.4. Workspace chung (UC09 – UC11, UC16)

- [x] FR-54 – FR-68 Tạo workspace, mã 7 ký tự, Khám phá, duyệt, màu, tên tạm (`routers/join.py`, `routers/workspaces.py`)
- [x] FR-98 – FR-106 Thành viên, tên, vai, rời, xóa, đề bài, đổi mã, tạo kênh, đổi tên workspace (`test_ws_workspace_rename.py`)
- [x] FR-117 – FR-126 Bảng phân công dạng cây 3 cấp, nhận, giao, khóa, `/task`, gỡ người rời, agent đọc việc chưa xong (`app/ws/tasks.py`, `routers/tasks.py`, `features/tasks/`; test `test_ws_tasks.py` (14), `task-tree.test.ts`)

### 2.5. Kênh, bảng ý tưởng và tổng hợp (UC12 – UC15)

- [x] FR-69 – FR-76 Kênh realtime SSE, gợi ý `@` và `/`, lệnh chỉ chạy khi người gõ
- [x] FR-77 – FR-84 Highlight cho agent nhiều đoạn, giữ người nói
- [x] FR-85 – FR-92 Bảng ý tưởng bốn cột, `/idea` `/note` `/pin` `/decide`, chỉ chủ đưa vào bàn
- [x] FR-93 – FR-97 `/summarize`, `/brief`, tải Markdown (`GET /workspaces/{id}/brief.md`)
- [ ] **Xuất báo cáo dạng PDF/in được** (tiêu chí "file báo cáo" của bảng chấm). Hiện chỉ có Markdown.

### 2.6. Kết nối (UC17)

- [x] FR-107 – FR-110 Dải mất kết nối, giữ chữ đang soạn, nối lại bằng `after=<seq>`

### 2.7. Phần làm sau (SRS mục 8.2)

- [ ] Lệnh `/check` · [ ] Mời qua email/GitHub · [ ] Sửa, xóa tin trong kênh

**Nhận xét:** toàn bộ FR mức M và T trong SRS 0.4 đã có code. Việc còn lại về chức năng là **chứng minh** chúng chạy (test truy vết, e2e) chứ không phải viết thêm tính năng.

---

## 3. Hiện trạng: phi chức năng

Mã NFR theo SRS 0.4 mục 7.

- [x] NFR-01 Key mã hóa, chỉ ghi (Fernet). [ ] Chưa có test quét log/phản hồi để chứng minh key không lộ ở mọi endpoint
- [x] NFR-02 Mọi lời gọi mô hình qua backend
- [x] NFR-03 OAuth có `state` ký; mã email lưu HMAC, có giới hạn gửi và nhập sai (có test); cookie httpOnly
- [x] NFR-04, NFR-05 Kiểm quyền ở backend (`backend/app/ws/deps.py`). [~] Cần bảng quyết định phân quyền (vai × thao tác, testplan mục 7.3) có test đủ ô
- [~] NFR-06 Tin mới dưới 2 giây: có SSE, **chưa đo**
- [x] NFR-07 Stream ngay chữ đầu
- [x] NFR-08 Ngân sách ngữ cảnh. [ ] Chưa có test theo thuộc tính (Hypothesis)
- [x] NFR-09 Lỗi nhà cung cấp tiếng Việt
- [~] NFR-10 Trạng thái tải/rỗng/lỗi: có `loading.tsx`, cần rà từng màn
- [x] NFR-11 Hộp xác nhận trong ứng dụng cho xóa, rời, xóa việc
- [ ] NFR-12 Bàn phím + WCAG AA: chưa kiểm bằng công cụ (axe)
- [~] NFR-13 Màn hình hẹp: có container query, chưa kiểm có hệ thống
- [x] NFR-14 Chữ hiển thị trong `locales/{vi,en}.json` (`scripts/check-source-rules.mjs`)
- [x] NFR-15 Xử lý mất kết nối theo UC17
- [x] NFR-16 `/api/v1` và dạng lỗi `{"error":{...}}`

---

## 4. Chỗ thực tế đã lệch kế hoạch sprint

`docs/SPRINT_PLAN.md` viết theo Supabase + Vercel, nhưng code thực tế đi hướng khác. Cần **sửa lại SPRINT_PLAN/SRS mục ràng buộc** cho khớp, nếu không giáo viên sẽ thấy tài liệu và code mâu thuẫn (trừ điểm "Document standard").

| Kế hoạch ghi | Thực tế trong code | Việc cần làm |
|---|---|---|
| Thư mục `api/` mới, không đụng `backend/` | Workspace nằm trong `backend/app/ws/`, trong app FastAPI hiện có | Sửa SPRINT_PLAN mục "Mã nguồn" và quy tắc 4 |
| Supabase Auth, RLS, Vault, Realtime | OAuth tự làm, token HMAC trong cookie, kiểm quyền ở `deps.py`, key mã hóa Fernet, realtime bằng SSE | Ghi lại quyết định thành ADR ngắn (lý do: chạy local không cần dịch vụ ngoài) |
| Alembic migration | SQLAlchemy + SQLite (`database_url` mặc định), chưa có migration | Hoặc thêm Alembic, hoặc ghi rõ lý do bỏ trong tài liệu |
| LiteLLM | Gọi thẳng HTTP tới hai nhà cung cấp (`providers.py`) | Cập nhật tài liệu |
| Web trên Vercel | Docker + Caddy trên VPS, tự deploy qua GitHub Actions (`deploy/`) | Cập nhật tài liệu |
| Playwright 3 kịch bản, Hypothesis, Schemathesis, độ phủ ≥ 80% | Playwright chỉ dùng chụp prototype; chưa có Hypothesis, Schemathesis, đo độ phủ | Làm ở tuần 3 (mục 5) |
| PR có review, gộp vào `main` | Mới **4 commit** trên `dev`, một khối thay đổi lớn chưa commit | Commit theo việc, mở PR, review chéo ngay từ bây giờ |

---

## 5. Kế hoạch còn lại (viết lại)

Chức năng Must đã xong sớm hơn lịch, nên phần thời gian còn lại (N2 – N15) chuyển sang **ổn định, kiểm thử, tài liệu và bằng chứng quy trình**, đúng chỗ bảng chấm cho nhiều điểm. Giữ nguyên ba mốc demo M1, M2, M3.

### Tuần 1 còn lại (17/11 – 20/11): chốt nền và quy trình

| Mã | Việc | Người | Xong khi |
|---|---|---|---|
| P01 | Chia khối thay đổi hiện tại thành các commit theo tính năng; tạo nhánh `feature/*`, mở PR vào `main`, người kia duyệt | TV1 + TV2 | `main` có code hiện tại qua PR đã duyệt |
| P02 | Bật GitHub Issues + Projects (bảng Kanban), nhãn `bug`, `feature`, `docs`, `test`; mẫu báo lỗi `.github/ISSUE_TEMPLATE/bug.md`; mẫu PR | TV2 | Mọi việc mục 5 có issue; lỗi mới đều có issue |
| P03 | Sửa SPRINT_PLAN và SRS mục 2.3 cho khớp kiến trúc thật (bảng mục 4); thêm `docs/ADR.md` | TV1 | Không còn chỗ tài liệu nói Supabase/Vercel |
| P04 | Biên bản họp: `docs/meetings/` mỗi ngày 3 dòng (hôm qua, hôm nay, vướng) | Scrum Master | Có biên bản từ N2 |
| P05 | Cấu hình OAuth Google/GitHub thật trên môi trường demo | TV2 | M1.1 đạt với tài khoản thật |

**Mốc M1 (20/11):** hai tài khoản thật nhắn tin realtime; workspace riêng không lộ cho người khác (có test); agent giả stream được.

### Tuần 2 (23/11 – 27/11): kiểm thử tự động có công cụ

| Mã | Việc | Người | Xong khi |
|---|---|---|---|
| T01 | Thêm `pytest-cov` và `@vitest/coverage-v8`; CI xuất báo cáo độ phủ (HTML/artifact) | TV2 | CI có artifact độ phủ |
| T02 | Gắn mã FR vào mọi test (`# FR-xx` / tên test); script sinh **bảng truy vết FR → test** | TV1 | Mỗi FR Must có ít nhất một test |
| T03 | Hypothesis: bộ phân tích lệnh không ném lỗi; bộ dựng ngữ cảnh không vượt ngân sách, không chứa tin người khác | TV2 | Test chạy trong CI |
| T04 | Test phân quyền theo bảng quyết định (chủ / thành viên / người ngoài × đọc / ghi / quản trị) cho mọi endpoint ws | TV2 | Bảng có trong báo cáo, mọi ô có test |
| T05 | Test bảo mật key: quét toàn bộ phản hồi API và log khi lưu/dùng key | TV2 | Không chuỗi key nào xuất hiện |
| T06 | Thêm test Vitest cho composer, highlight dialog, chat-screen, join form | TV1 | Vitest ≥ 60 test |
| F01 | Xuất bản tổng hợp ra **PDF** (in từ trang brief hoặc sinh ở backend) | TV1 | Tải được PDF từ trang Bản tổng hợp |

**Mốc M2 (27/11):** demo trọn vòng trên một đề bài mẫu (sáu điều của SPRINT_PLAN M2) + báo cáo độ phủ đầu tiên.

### Tuần 3 (30/11 – 04/12): e2e, tài liệu, bàn giao

| Mã | Việc | Người | Xong khi |
|---|---|---|---|
| T07 | Playwright: `web_ui/e2e/` với 3 kịch bản (trọn vòng hai người; tham gia bằng mã; highlight và agent nêu đúng người nói), chạy trong CI | TV1 | Ba kịch bản xanh trong CI |
| T08 | Schemathesis cho toàn bộ OpenAPI ws | TV2 | Không có lỗi 500 |
| T09 | axe-core trong Playwright cho các màn chính; đo thời gian tin tới (NFR-05) | TV1 | Kết quả ghi vào báo cáo kiểm thử |
| T10 | Kiểm thử thủ công theo `web_ui/testplan.md` mục 6; ghi kết quả từng ca (đạt/lỗi + issue) | TV1 + TV2 | Bảng ca thử thủ công có kết quả |
| D01 | `docs/USER_GUIDE.md`: hướng dẫn sử dụng theo từng vai, có ảnh chụp màn hình (dùng lại `pnpm prototype:pdf`) | TV1 | Có mục lục, đủ 15 ca sử dụng |
| D02 | `docs/INSTALL.md`: cài local (Docker một lệnh, chạy tay), cài server, biến môi trường, xử lý sự cố | TV2 | Người ngoài nhóm cài được theo tài liệu |
| D03 | `docs/TEST_REPORT.md`: truy vết FR → ca thử, kết quả từng kỹ thuật, độ phủ, danh sách lỗi đã tìm/sửa | TV1 + TV2 | Đã gộp |
| D04 | Thêm mục lục cho SRS, SPRINT_PLAN, testplan, README; xuất sơ đồ UML (`uml/`) ra ảnh và nhúng vào tài liệu | TV1 | Mọi tài liệu dài có mục lục |
| D05 | `docs/FEEDBACK.md`: phản hồi của trưởng nhóm/người dùng thử (từ `SCRIPT4_PHAN_HOI.md` và buổi demo) → thay đổi đã làm | Product Owner | Mỗi phản hồi có trạng thái |
| R01 | Đóng băng mã cuối N14; kiểm tra khói trên server; diễn tập demo | TV1 + TV2 | Demo trọn vòng không lỗi |
| R02 | Tag `v1.0.0`, ghi CHANGELOG, nhìn lại sprint (`docs/RETRO.md`) | Scrum Master | Có tag và biên bản nhìn lại |

**Mốc M3 (04/12):** như SPRINT_PLAN M3, cộng: User Guide, Install Guide, Test Report có trong repo.

### Làm nếu còn thời gian

1. S3: mời qua email/GitHub.
2. S2: chia sẻ bản chụp hội thoại.

---

## 6. Checklist theo tiêu chí chấm

### 6.1. Source code

- [x] Kiến trúc phân lớp: backend `routers/` (API) → `service.py`, `context.py`, `commands.py` (nghiệp vụ) → `models.py` (dữ liệu); frontend `app/` (route) → `features/` (giao diện) → `lib/api/` (truy cập dữ liệu)
- [x] Module rõ ràng theo tính năng, dễ bảo trì
- [x] Quy ước code: ESLint, Prettier, `tsc` strict, cấm mã hex (`pnpm check`)
- [~] Backend: thêm `ruff` và `mypy` vào CI (kế hoạch có, CI chưa chạy)
- [x] Cài đặt bằng Docker một lệnh (`docker compose up --build`)
- [ ] Tài liệu cài đặt riêng (`docs/INSTALL.md`) — D02
- [ ] Script khởi tạo một lệnh cho máy dev (tạo `.env`, seed dữ liệu) — gộp vào D02
- [~] Migration CSDL (Alembic) hoặc ghi rõ lý do dùng `create_all` — P03

### 6.2. Chạy ứng dụng

- [x] Loại ứng dụng: **web app** (Next.js 16 + FastAPI), chạy trên trình duyệt desktop, bố cục co giãn. Ghi rõ trong README và User Guide
- [x] Triển khai được trên VPS (Docker + Caddy HTTPS, tự deploy qua GitHub Actions)
- [x] Đủ FR Must (mục 2)
- [ ] Xuất báo cáo PDF — F01
- [~] Không lỗi khi thêm/sửa/xóa: cần kịch bản khói và e2e chứng minh — T07, R01
- [~] Giao diện: chủ đề tối kiểu Discord. Bảng mẫu bị nhận xét "màu nền hơi tối" → cân nhắc thêm chủ đề sáng hoặc kiểm độ tương phản bằng axe — T09
- [ ] Đo hiệu năng: thời gian tin tới < 2 giây, thời gian token đầu — T09

### 6.3. Sưu liệu

- [x] Đặc tả yêu cầu: `docs/SRS.md` 0.4 (ca sử dụng, FR, NFR, quy tắc nghiệp vụ), `software-requirements-specification.md`, `use-cases.md`, `business-rules.md`, `vision-and-scope.md` (cập nhật 21/11 theo website đang chạy)
- [x] Đặc tả hệ thống/dữ liệu: `uml/` (class, sequence, activity, RBAC), `backend/WORKSPACE_API.md`, OpenAPI tại `/docs`
- [x] Đặc tả giao diện: `docs/UI_FLOW.md`, `web_ui/flow.md`, `prototype.pdf`
- [x] Kế hoạch: `docs/SPRINT_PLAN.md`, `docs/testplan.md`
- [ ] Mục lục cho mọi tài liệu dài — D04
- [ ] Tài liệu khớp với code (bỏ Supabase/Vercel) — P03
- [ ] User Guide — D01
- [ ] Installation Guide — D02
- [ ] Trang bìa/thông tin nhóm, phiên bản tài liệu trong mỗi file chính

### 6.4. Kiểm thử

- [x] Kiểm thử API backend (pytest, 103 test đạt ngày 21/11)
- [x] Kiểm thử đơn vị frontend (Vitest, 54 test đạt trong 17 tệp ngày 21/11)
- [x] Agent giả tất định để test không tốn tiền (`LLM_FAKE=true`)
- [x] CI chạy test tự động (`.github/workflows/backend.yml`, `web.yml`)
- [ ] Kiểm thử theo thuộc tính (Hypothesis) — T03
- [ ] Kiểm thử theo bảng quyết định cho phân quyền — T04
- [ ] Kiểm thử hợp đồng API (Schemathesis) — T08
- [ ] Kiểm thử đầu-cuối (Playwright) — T07
- [ ] Kiểm thử trợ năng (axe) và hiệu năng — T09
- [ ] Kiểm thử thủ công có ghi kết quả — T10
- [ ] Đo độ phủ, mục tiêu ≥ 80% module lõi — T01
- [ ] Bảng truy vết FR → test — T02
- [ ] Báo cáo kiểm thử — D03

### 6.5. Công cụ

- [x] Phát triển: VS Code, Next.js, FastAPI, pnpm, Docker, PlantUML
- [x] Quản lý cấu hình: Git, GitHub, CI GitHub Actions
- [ ] Quản lý cấu hình đầy đủ: nhánh theo tính năng, PR có review, tag phiên bản, CHANGELOG — P01, R02
- [ ] Kiểm soát bug: GitHub Issues với nhãn và mẫu báo lỗi; mỗi lỗi có issue, PR sửa đóng issue — P02
- [ ] Kiểm soát report: báo cáo độ phủ và kết quả test tự sinh trong CI (artifact), Playwright HTML report — T01, T07

### 6.6. Quy trình

- [x] Kế hoạch Scrum một sprint 3 tuần, ba mốc, quy tắc cắt (`docs/SPRINT_PLAN.md`)
- [ ] Product backlog / bảng Kanban trên GitHub Projects — P02
- [ ] Biên bản họp hằng ngày — P04
- [ ] Biên bản demo ở ba mốc M1, M2, M3
- [ ] Biểu đồ burndown (từ GitHub Projects hoặc bảng tính)
- [ ] Biên bản nhìn lại sprint — R02

### 6.7. Phối hợp làm việc

- [x] Phân vai TV1/TV2, Product Owner/Scrum Master trong SPRINT_PLAN
- [ ] Gán tên thật cho TV1, TV2 (SPRINT_PLAN mục 12 còn bỏ ngỏ)
- [ ] Lịch sử commit thể hiện đóng góp của cả hai người (hiện chỉ 4 commit)
- [ ] PR có review chéo trong 24 giờ
- [ ] Bảng đóng góp từng người trong báo cáo cuối

### 6.8. Phản hồi khách hàng

- [x] Có phản hồi của trưởng nhóm (`docs/SCRIPT4_PHAN_HOI.md`) và SRS 0.2 đã đổi theo
- [ ] Ghi lại phản hồi → quyết định → thay đổi (`docs/FEEDBACK.md`) — D05
- [ ] Cho 2–3 người ngoài nhóm dùng thử theo User Guide, thu phiếu nhận xét
- [ ] Phản hồi sau demo M2 được đưa vào tuần 3

---

## 7. Tự chấm dự kiến

Thang 1–5 theo bảng mẫu. "Hiện tại" là nếu nộp ngay hôm nay; "Sau kế hoạch" là khi xong mục 5.

| Tiêu chí | Hiện tại | Sau kế hoạch | Việc quyết định |
|---|---|---|---|
| Độ phức tạp | 4 | 4 | – |
| Tính dễ đọc/hiểu | 4 | 4 | – |
| Code standard | 4 | 5 | ruff/mypy trong CI |
| Cài đặt chương trình | 3 | 5 | D02 |
| Dễ bảo trì | 4 | 5 | Migration, ADR |
| Loại ứng dụng, platform | 3 | 5 | Nêu rõ, đã deploy |
| Chạy tốt, ổn định | 3 | 5 | T07, R01 |
| Chức năng đầy đủ | 4 | 5 | F01 (PDF) |
| Giao diện thân thiện | 4 | 4 | T09 |
| Lỗi chương trình | 3 | 5 | e2e + kiểm thử thủ công |
| Hiệu năng | 3 | 4 | Đo NFR-05, NFR-06 |
| Sưu liệu: độ phức tạp | 4 | 4 | – |
| Sưu liệu: dễ đọc | 4 | 5 | Mục lục, ảnh |
| Document standard | 3 | 5 | P03, D04 |
| Đặc tả chức năng/hệ thống/dữ liệu/giao diện | 5 | 5 | – |
| User guide, cài đặt | 1 | 5 | D01, D02 |
| Vận dụng các loại kiểm thử | 3 | 5 | T03 – T10 |
| Công cụ kiểm thử | 3 | 5 | Playwright, Hypothesis, Schemathesis, coverage |
| Tools phát triển | 4 | 5 | – |
| Kiểm soát bug | 0 | 4 | P02 |
| Kiểm soát report | 1 | 4 | T01 |
| Quản lý cấu hình | 2 | 5 | P01, R02 |

Ba việc mang lại nhiều điểm nhất với ít công nhất: **D01 + D02** (user guide, cài đặt), **P02** (issue tracker), **P01** (commit/PR đúng quy trình). Nên làm ngay trong tuần này.
