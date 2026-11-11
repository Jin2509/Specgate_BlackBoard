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

Hiện frontend chạy bằng dữ liệu giả ở `web_ui/src/lib/mock/` (số liệu ADOM là số thật của lượt MAIN). Khi có backend, các hàm trong `mock/queries.ts` được thay bằng client sinh từ OpenAPI (F03).

Đăng nhập cũng là giả lập bằng cookie (`web_ui/src/lib/session*.ts`, `auth-actions.ts`, `proxy.ts`); khi có Supabase Auth chỉ thay phần đọc/ghi phiên. Tài khoản thử: `trang@example.edu` (thành viên Đồ án, đang xin vào ADOM), `lan@example.edu` (chủ Đồ án và ADOM). Liên kết mời thử: `/invite/doan-kc26`, `/invite/adom-main`.

## Luồng đăng nhập và tham gia

1. Mọi trang đều cần đăng nhập; chưa đăng nhập thì `proxy.ts` chuyển về `/login?next=…` và quay lại đúng trang sau khi đăng nhập.
2. Lần đầu đăng nhập vào `/welcome`: bắt đầu ở workspace riêng, tạo workspace chung, khám phá, hoặc dán liên kết mời. Những lần sau `/` mở workspace dùng gần nhất.
3. Vào workspace chung theo hai đường:
   - **Liên kết mời** (`/invite/<mã>`): thành viên lấy liên kết ở menu tên workspace → Mời mọi người; người nhận bấm Chấp nhận là vào thẳng.
   - **Xin tham gia**: trang Khám phá (la bàn ở thanh trái) → gửi yêu cầu kèm gói ngữ cảnh → chủ workspace duyệt ở Yêu cầu tham gia.
4. Mở một workspace chưa là thành viên thì bị chuyển sang trang Khám phá, chọn sẵn workspace đó.

| Lệnh | Việc |
|---|---|
| `pnpm check` | Toàn bộ kiểm tra của CI: cấm mã hex, ESLint, `tsc`, Prettier, Vitest |
| `pnpm test` | Vitest |
| `pnpm format` | Prettier (kèm sắp xếp class Tailwind) |
| `pnpm build` | Build production |
| `pnpm prototype:pdf` | Chụp 15 màn hình từ app đang chạy, xuất `docs/prototype.pdf` (cần `pnpm start` hoặc `pnpm dev` trước; đổi địa chỉ bằng `BASE_URL`) |

## Cấu trúc `web_ui/src`

```
app/                 Chỉ có route: lấy dữ liệu qua lib/mock/queries rồi ghép component (layout, page, not-found, icon.svg)
features/<trang>/    Component riêng của từng trang, test đặt cạnh file
  workspace-shell/   Thanh workspace, cột điều hướng, hộp thoại tạo workspace (03)
  login/             01 và khung chung AuthScreen · onboarding/ màn chào, thẻ lời mời
  channel/           02, 04, 05, 15 (composer/ là ô soạn và gợi ý @ /)
  board/             06, 07 · brief/ 08 · explore/ 09 · requests/ 10 · settings/ 11
  runs/              12 · metrics/ 13, 14 và thẻ /stats, /run hiện trong kênh
components/ui/       shadcn/ui (không sửa tay)
components/common/   Thành phần dùng chung giữa các trang: PageLayout/PageHeader/PageBody, Panel,
                     SegmentedControl, ToneBadge, LegendSwatch, ActorAvatar, Logo
lib/                 Kiểu dữ liệu, bảng màu trạng thái, lệnh, bản tổng hợp, helper route
lib/mock/            Dữ liệu giả; chỉ queries.ts được đọc data.ts
lib/session*.ts      Phiên đăng nhập giả lập bằng cookie; proxy.ts chặn route và điều hướng trang gốc
hooks/               useQueryParam (mở sẵn hộp thoại cho ảnh chụp prototype)
```

- Trang mới: tạo `features/<trang>/` cho component, route trong `app/` chỉ gọi `requireWorkspace(params)` và các hàm của `queries.ts`.
- Component phía client không import `lib/mock`: dữ liệu (kể cả tên người, agent) đi vào qua props, ví dụ `BoardCard` mang sẵn `authorName`.
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
| `/welcome` | Màn chào sau lần đăng nhập đầu |
| `/invite/[code]` | Nhận lời mời vào workspace chung |
| `/w/[ws]/c/[channel]` | 02, 04, 05, 15 Kênh chat và bảng ý tưởng ở khung bên |
| `?dialog=create` trên mọi trang workspace | 03 Tạo workspace chung |
| `/w/[ws]/board` (`?decide=<id>`) | 06 Bảng ý tưởng, 07 Chốt hoặc loại |
| `/w/[ws]/brief` | 08 Bản tổng hợp |
| `/w/[ws]/explore` | 09 Tìm workspace và xin tham gia |
| `/w/[ws]/requests` | 10 Duyệt yêu cầu tham gia (chỉ chủ workspace) |
| `/w/[ws]/settings` | 11 Thành viên và agent |
| `/w/[ws]/runs` | 12 Nhập lượt chạy ADOM |
| `/w/[ws]/metrics`, `/metrics/repairs` | 13, 14 Bảng số liệu |
