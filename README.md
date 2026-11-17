# SpecGate Workspace

Bảng đen chung cho người và LLM: một workspace để nhóm lên ý tưởng cho bất kỳ đề bài nào mà không mất ngữ cảnh. Ca sử dụng đầu tiên là nghiên cứu bài báo ADOM.

```
.
├── web_ui/     Frontend: Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, shadcn/ui, Lucide
├── backend/    Backend FastAPI + SQLAlchemy, gọi pipeline ADOM (repo spec-gate đặt cạnh repo này)
├── deploy/     Cấu hình server: Caddy (HTTPS, mật khẩu chung), lớp phủ compose, script cập nhật
├── compose.yaml  Chạy cả backend và web bằng Docker
└── docs/       Tài liệu nội bộ: spec, kế hoạch sprint, đề xuất công nghệ, prototype (không đưa lên git)
```

## Chạy cả hệ thống bằng Docker

```bash
git clone -b cleanup-scripts <repo spec-gate> ../spec-gate   # pipeline ADOM, đặt cạnh repo này
docker compose up --build      # web http://localhost:3000, backend http://localhost:8000/docs
```

Chạy riêng backend: xem `backend/README.md`. Triển khai lên server: xem `deploy/README.md`.

## Chạy frontend

Yêu cầu Node 24 (xem `.nvmrc`) và pnpm 11.

```bash
cd web_ui
pnpm install
pnpm dev            # http://localhost:3000, mở trang đăng nhập
```

Frontend lấy toàn bộ dữ liệu từ backend (`/api/*`, xem `docs/WORKSPACE_API.md`), nên cần chạy backend và nạp dữ liệu demo trước:

```bash
cd backend && source .venv/bin/activate
cp .env.example .env           # một lần: LLM_FAKE=true (agent giả, không tốn tiền), AUTH_DEV_LOGIN=true
python -m app.ws.seed          # một lần: Lan, Long, Trang (thêm --reset để làm lại từ đầu)
uvicorn app.main:app --reload --port 8000
```

Cách nối:

- `next.config.ts` rewrite `/api/*` sang `BACKEND_URL` (mặc định `http://localhost:8000`). Server component và server action gọi backend qua `lib/api/` (`client.ts` fetch + `ApiError`, `server.ts` kèm token từ cookie, `queries.ts` một hàm cho mỗi endpoint đọc). Trình duyệt chỉ gọi thẳng `/api` cho hai luồng SSE: trả lời của agent (`features/personal/chat-screen.tsx`) và tin mới trong kênh (`features/channel/channel-live.tsx`).
- Phiên: token backend nằm trong cookie httpOnly `sg_session`; `proxy.ts` hỏi `GET /api/auth/session` ở mỗi lần điều hướng và ghi nhớ workspace vừa mở (`PUT /api/me/last-workspace`). Chưa cấu hình OAuth thật thì nút Google/GitHub mở màn chọn tài khoản giả lập (`GET /api/auth/dev-accounts`, `POST /api/auth/dev-login`); cấu hình rồi thì đi thẳng `/api/auth/{provider}/start`.
- Ghi dữ liệu qua server action (`lib/*-actions.ts`), mỗi action một endpoint; xong gọi `revalidatePath("/", "layout")` để thanh workspace và các số đếm cập nhật.
- Chỉ còn số liệu ADOM (các màn 12, 13, 14) là dữ liệu giả ở `lib/adom.ts`; backend chưa gắn ADOM vào workspace nên các màn này hiện không mở được từ giao diện.

Tài khoản thử (màn chọn tài khoản giả lập sau khi bấm nút): GitHub `Lan` (chủ "Đồ án Kiểm chứng", mã `KC26DAX`), GitHub `Long` (thành viên), Google `Trang` (có key, chưa vào workspace chung nào). Tài khoản mới: tab *Tạo tài khoản*, điền tên GitHub hoặc email bất kỳ.

## Luồng đăng nhập và tham gia

1. Mọi trang đều cần đăng nhập; chưa đăng nhập thì `proxy.ts` chuyển về `/login?next=…` và quay lại đúng trang sau khi đăng nhập.
2. Chỉ đăng nhập bằng **Google** hoặc **GitHub** (`/login` → `/login/google|github` chọn tài khoản). Không có mật khẩu, không có email.
3. Đăng nhập xong vào thẳng **workspace riêng** (tạo sẵn cho mỗi người). Những lần sau `/` mở workspace dùng gần nhất nếu vẫn là thành viên.
4. Vào workspace chung bằng **mã tham gia** (kiểu mã nhóm của Microsoft Teams):
   - Thành viên mở menu tên workspace → *Chia sẻ mã tham gia*, chép mã 7 ký tự do hệ thống sinh. Chủ workspace bấm *Đổi mã* để sinh mã mới, mã cũ hết hiệu lực ngay (cũng có ở trang Thành viên và agent).
   - Người nhận bấm nút chìa khóa ở thanh trái (hoặc ô mã ở trang Khám phá), nhập mã → tạo yêu cầu và chuyển sang trang `/join/<id>` **Đang chờ duyệt**. Workspace đang chờ hiện mờ, viền đứt trên thanh trái.
   - Chủ workspace thấy yêu cầu ở *Yêu cầu tham gia* (tự làm mới), bấm Duyệt hoặc Từ chối. Duyệt xong, trang chờ của người xin tự chuyển vào workspace.
5. Không có mã: trang Khám phá (la bàn) → gửi yêu cầu kèm gói ngữ cảnh → chủ duyệt và nhập gói vào bảng ở trạng thái đề xuất.
6. Mở một workspace chưa là thành viên thì bị chuyển sang trang Khám phá, chọn sẵn workspace đó.

| Lệnh | Việc |
|---|---|
| `pnpm check` | Toàn bộ kiểm tra của CI: cấm mã hex, ESLint, `tsc`, Prettier, Vitest |
| `pnpm test` | Vitest |
| `pnpm format` | Prettier (kèm sắp xếp class Tailwind) |
| `pnpm build` | Build production |
| `pnpm prototype:pdf` | Chụp 15 màn hình từ app đang chạy, xuất `docs/prototype.pdf` (cần `pnpm start` hoặc `pnpm dev` trước; đổi địa chỉ bằng `BASE_URL`) |

## Cấu trúc `web_ui/src`

```
app/                 Chỉ có route: lấy dữ liệu qua lib/api/queries rồi ghép component (layout, page, loading, not-found, icon.svg)
features/<trang>/    Component riêng của từng trang, test đặt cạnh file
  workspace-shell/   Thanh workspace, cột điều hướng, hộp thoại tạo workspace (03)
  login/             01, chọn tài khoản Google/GitHub và khung chung AuthScreen
  join/              Mã tham gia: ô nhập mã, hộp thoại chia sẻ/đổi mã, thẻ trạng thái chờ duyệt
  channel/           02, 04, 05, 15 (composer/ là ô soạn và gợi ý @ /)
  board/             06, 07 · brief/ 08 · explore/ 09 · requests/ 10 · settings/ 11
  runs/              12 · metrics/ 13, 14 và thẻ /stats, /run hiện trong kênh
components/ui/       shadcn/ui (không sửa tay)
components/common/   Thành phần dùng chung giữa các trang: PageLayout/PageHeader/PageBody, Panel,
                     SegmentedControl, ToneBadge, LegendSwatch, ActorAvatar, Logo
lib/                 Kiểu dữ liệu (types.ts, khớp JSON backend), bảng màu trạng thái, lệnh, định dạng thời gian, helper route
lib/api/             Gọi backend: client.ts (fetch, ApiError), server.ts (token từ cookie), auth.ts, queries.ts (đọc)
lib/*-actions.ts     Server action ghi dữ liệu: auth, private (workspace riêng), channel, join, board, workspace
lib/adom.ts          Số liệu ADOM giả cho các màn số liệu
lib/session*.ts      Phiên đăng nhập (token backend trong cookie); proxy.ts chặn route và điều hướng trang gốc
hooks/               useQueryParam (mở sẵn hộp thoại cho ảnh chụp prototype)
```

- Trang mới: tạo `features/<trang>/` cho component, route trong `app/` bọc nội dung trong `<Suspense>` (xem `board/page.tsx`), gọi `requireWorkspace(params)` và các hàm của `lib/api/queries.ts`.
- Component phía client không gọi backend (trừ hai luồng SSE): dữ liệu đi vào qua props, thời gian định dạng sẵn ở máy chủ (`lib/time.ts`), ví dụ `BoardCard` mang sẵn `authorName` và `atLabel`.
- Một feature dùng component của feature khác qua đường dẫn đầy đủ (`@/features/board/board-item-card`); thứ dùng ở từ ba trang trở lên chuyển sang `components/common/`.

## Quy ước giao diện

- **Màu chỉ khai báo bằng token** ở `web_ui/src/app/globals.css` (chủ đề tối kiểu Discord: ba tầng nền xám, một màu nhấn tím xanh `#5865f2`). Mã hex trong `.ts`/`.tsx` làm `pnpm check` đỏ.
- **Màu trạng thái có nghĩa cố định** và chỉ xuất hiện ở chấm nhỏ, nhãn và biểu đồ, không tô viền hay nền thẻ: vàng đề xuất, xanh trời đang bàn, xanh lục đã chốt và PASS, đỏ đã loại và cảnh báo, cam dữ kiện ADOM, tím thiếu dữ liệu. `INSUFFICIENT_DATA` không bao giờ dùng màu của PASS (có test).
- **Lưới co giãn theo vùng nội dung** (container query `@container`, `@2xl:`…), không theo bề rộng màn hình, vì hai cột bên trái đã chiếm sẵn 312px.
- **Icon** chỉ dùng Lucide. Thành phần nền là shadcn/ui ở `web_ui/src/components/ui/` (không sửa tay, cập nhật bằng `pnpm dlx shadcn@latest add`).
- Next.js 16 có thay đổi so với các bản trước (`cacheComponents`, `params` là Promise, `PageProps`/`LayoutProps` toàn cục). Đọc `web_ui/node_modules/next/dist/docs/` trước khi dùng API lạ.

## Bản đồ route

| Route | Màn hình prototype |
|---|---|
| `/login` (`?next=`) | 01 Đăng nhập |
| `/login/google`, `/login/github` | Chọn tài khoản (giả lập trang OAuth) |
| `/join/[request]` | Đang chờ chủ workspace duyệt (tự chuyển vào khi được duyệt) |
| `?dialog=join` trên mọi trang workspace | Hộp thoại tham gia bằng mã |
| `/w/[ws]/c/[channel]` | 02, 04, 05, 15 Kênh chat và bảng ý tưởng ở khung bên |
| `?dialog=create` trên mọi trang workspace | 03 Tạo workspace chung |
| `/w/[ws]/board` (`?decide=<id>`) | 06 Bảng ý tưởng, 07 Chốt hoặc loại |
| `/w/[ws]/brief` | 08 Bản tổng hợp |
| `/w/[ws]/explore` | 09 Tìm workspace và xin tham gia |
| `/w/[ws]/requests` | 10 Duyệt yêu cầu tham gia (chỉ chủ workspace) |
| `/w/[ws]/settings` | 11 Thành viên và agent |
| `/w/[ws]/runs` | 12 Nhập lượt chạy ADOM |
| `/w/[ws]/metrics`, `/metrics/repairs` | 13, 14 Bảng số liệu |
