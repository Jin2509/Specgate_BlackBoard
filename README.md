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

Đăng nhập cũng là giả lập bằng cookie (`web_ui/src/lib/session*.ts`, `auth-actions.ts`, `proxy.ts`); khi có Supabase Auth chỉ thay phần đọc/ghi phiên. Dữ liệu thay đổi được (thành viên, mã tham gia, yêu cầu tham gia, bảng ý tưởng) nằm trong kho `lib/mock/store.ts` sống trong tiến trình máy chủ: khởi động lại `pnpm dev`/`pnpm start` là về dữ liệu ban đầu.

Tài khoản thử (trang chọn tài khoản giả lập sau khi bấm nút):

| Nhà cung cấp | Tài khoản | Ghi chú |
|---|---|---|
| GitHub | Trang, Lan, Huy | Lan là chủ Đồ án và ADOM; Trang đang xin vào ADOM |
| Google | Lan, Vy, Minh | Minh là tài khoản mới, chưa ở workspace chung nào |

Mã tham gia thử: `KC26DAX` (Đồ án), `ADM7Q3P` (ADOM), `ONT4H8W` (Ôn thi).

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
app/                 Chỉ có route: lấy dữ liệu qua lib/mock/queries rồi ghép component (layout, page, not-found, icon.svg)
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
lib/                 Kiểu dữ liệu, bảng màu trạng thái, lệnh, bản tổng hợp, helper route
lib/mock/            Dữ liệu giả: data.ts (hạt giống), store.ts (kho ghi được), queries.ts (đọc), mutations.ts (ghi)
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
