# SpecGate Workspace: tổng quan website

Tài liệu ngắn về website: giải quyết bài toán gì, các luồng chính, những quy tắc đã chốt và công nghệ sử dụng. Rút gọn từ bản phản hồi Script4; phần mô-đun ADOM do nhóm khác phụ trách nên không nằm ở đây.

## 1. Bài toán

Hai người cùng lên ý tưởng, mỗi người hỏi một agent riêng (có thể khác nhà cung cấp, có thể cùng một họ). Các phiên chat không giao nhau, nên khi B gọi agent, agent không biết A đã bàn gì, đã loại gì. Kết quả là agent sinh lại giả thuyết đã bị loại hoặc đi lạc đề, và mọi người phải copy, dán ngữ cảnh qua lại.

SpecGate cho một **workspace chung**, nơi người và nhiều agent làm việc trên cùng một ngữ cảnh. Bên cạnh đó mỗi người vẫn có **workspace riêng** để tự hỏi agent của mình.

Ngữ cảnh chung không phải là toàn bộ đoạn chat. Đổ hết vào chỉ chuyển sự nhiễu sang chỗ khác, tốn token và agent vẫn có thể lấy nhầm ý đã bỏ. Giá trị nằm ở chỗ con người chọn lọc và đánh dấu; vì vậy **highlight** là tính năng trung tâm.

Điểm khác với các sản phẩm chat nhóm của từng nhà cung cấp: nhiều nhà cung cấp trong một kênh, ngữ cảnh do người chọn lọc, và bảng ý tưởng có trạng thái chốt hoặc loại kèm lý do.

## 2. Các phần của website

### Workspace riêng: chat với agent bằng key của mình

- Người dùng nhập API key của một nhà cung cấp, hệ thống kiểm key và trả danh sách mô hình để chọn, rồi chat nhiều lượt như một trang LLM, câu trả lời hiện dần (stream).
- Chỉ cần hai bộ chuyển đổi: Anthropic và định dạng kiểu OpenAI. Bộ thứ hai dùng được cho OpenAI, OpenRouter, DeepSeek, Groq, Ollama… chỉ khác địa chỉ API.
- Gọi mô hình qua backend, không gọi thẳng từ trình duyệt, để key không lộ ra tab Network.
- Key mã hóa khi lưu, chỉ ghi không đọc lại, giao diện chỉ hiện 4 ký tự cuối.
- Gói thuê bao như ChatGPT Plus hay Claude Pro không phải API key; màn nhập key ghi rõ điều này.
- Không có kênh, bảng hay thành viên. Chỉ người đó thấy.

### Highlight: đưa đoạn đáng bàn ra workspace chung

1. Trong workspace riêng, bôi đen một đoạn rồi bấm Highlight, chọn nhãn _Quan trọng_ hoặc _Cần xem xét_. Đoạn được lưu vào "Highlight của tôi".
2. Trong kênh của workspace chung, gõ `@` rồi chọn highlight. Đoạn hiện thành thẻ trích dẫn.
3. Agent được gọi trong kênh nhận đoạn đó kèm nhãn "chưa chốt", nên không coi là kết luận.
4. Khi tổng hợp, chủ workspace có thể bấm "Đưa lên bảng": đoạn vào cột Đề xuất, ghi nguồn là highlight của ai.

Highlight lưu **bản chụp văn bản**, không lưu vị trí ký tự. Xóa hội thoại riêng thì highlight vẫn còn. Người khác chỉ thấy đoạn đã highlight, không mở được hội thoại gốc.

### Workspace chung

- Kênh chat thời gian thực giữa người và agent theo vai: phát ý, phản biện, tổng hợp.
- Bảng ý tưởng có bốn cột: đề xuất, đang bàn, đã chốt, đã loại. Trạng thái phân biệt bằng cột và chữ, không tô màu. Chốt hoặc loại phải kèm lý do và không quay ngược được.
- Bản tổng hợp dựng từ bảng, tải được dạng Markdown.
- Vào workspace chung có hai cách, cả hai đều chờ chủ duyệt: nhập mã 7 ký tự do thành viên chia sẻ, hoặc tìm ở trang Khám phá rồi gửi yêu cầu kèm lời nhắn.

### Đăng nhập và đăng ký

Chỉ dùng Google hoặc GitHub, không có mật khẩu riêng. Lần đầu đăng ký, hệ thống tạo tài khoản kèm workspace riêng rồi chuyển sang màn nhập key. Tài khoản Google/GitHub đã đăng ký thì được đăng nhập luôn, không tạo trùng.

### Làm sau, nếu còn thời gian

- Chia sẻ cả một hội thoại vào kênh chung (bản chụp, chọn lượt, giới hạn số lượt).
- Mời qua email hoặc GitHub, bên cạnh mã tham gia.

## 3. Quy tắc đã chốt

| Chủ đề                | Quy tắc                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Key ở workspace riêng | Agent dùng key của chính người dùng đó                                                                             |
| Key ở workspace chung | Agent dùng key của chủ workspace; mỗi agent có trần chi phí, chạm trần thì từ chối và báo trong kênh               |
| Tổng hợp              | `/summarize`, `/brief` và "Đưa lên bảng" chỉ chủ workspace dùng được; thành viên thường nhận tin từ chối kèm lý do |
| Highlight             | Chỉ đánh dấu, chưa phải chốt; không tự vào bảng ý tưởng                                                            |
| Chốt và loại          | Chỉ người làm, bắt buộc lý do; agent không chốt được                                                               |
| Agent                 | Chỉ trả lời khi được gọi tên; agent gọi agent tối đa 2 lượt                                                        |
| Gọi agent cùng lúc    | Xếp hàng theo kênh, để câu trả lời sau thấy được câu trả lời trước                                                 |

Chưa chốt: ký hiệu gọi nội dung (`@` chia nhóm hay `#` riêng); giới hạn số lượt khi chia sẻ cả hội thoại.

## 4. Phạm vi trong 21 ngày (2 người)

15 ngày làm việc, 30 ngày công. Phần bắt buộc chiếm khoảng 29 ngày công:

- lõi workspace chung: đăng nhập, workspace, mã tham gia và duyệt, kênh realtime, agent theo vai, bảng ý tưởng, bộ dựng ngữ cảnh, lệnh, bản tổng hợp;
- workspace riêng nhập key, chat nhiều lượt có stream;
- highlight.

Đệm chỉ khoảng 1 ngày công, nên chia sẻ cả hội thoại và mời qua email/GitHub để sau. Nếu trễ, highlight lùi về "highlight cả tin nhắn" thay vì bôi đen một đoạn.

Chi tiết theo ngày nằm trong kế hoạch sprint.

## 5. Công nghệ

### Frontend (thư mục `web_ui/`, đang dùng)

| Phần          | Công nghệ                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Khung         | Next.js 16 (App Router, Server Components, Server Actions, Cache Components), React 19                   |
| Ngôn ngữ      | TypeScript ở chế độ strict                                                                               |
| Giao diện     | Tailwind CSS 4, shadcn/ui trên Radix UI, biểu tượng Lucide                                               |
| Font          | Be Vietnam Pro (đủ dấu tiếng Việt), JetBrains Mono cho tên mô hình và mã                                 |
| Màu           | Token CSS trong `src/app/globals.css`, chủ đề sáng trắng dịu và xanh dương; cấm viết mã hex trong `.tsx` |
| Kiểm thử      | Vitest, Testing Library, jsdom; Playwright cho kịch bản đầu-cuối                                         |
| Chất lượng mã | ESLint, Prettier, `tsc`; chạy chung bằng `pnpm check`                                                    |
| Quản lý gói   | pnpm                                                                                                     |

### Backend (theo kế hoạch sprint)

| Phần        | Công nghệ                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------- |
| API         | Python, FastAPI, Pydantic                                                                   |
| Dữ liệu     | Supabase Postgres; SQLAlchemy async với asyncpg; Alembic cho migration                      |
| Đăng nhập   | Supabase Auth với Google và GitHub                                                          |
| Phân quyền  | Row Level Security của Postgres, kèm kiểm tra thành viên ở API                              |
| Realtime    | Supabase Realtime: tin nhắn mới và câu trả lời agent stream tới mọi thành viên              |
| Lưu key     | Supabase Vault (mã hóa, chỉ ghi)                                                            |
| Gọi mô hình | Cổng LLM qua LiteLLM: stream, đếm token, ước tính chi phí; agent giả tất định cho dev và CI |
| Kiểm thử    | pytest, Hypothesis (kiểm thử theo thuộc tính), Schemathesis (kiểm thử theo OpenAPI)         |
| Triển khai  | Backend chạy Docker trên VPS, frontend trên Vercel                                          |

## 6. Hiện trạng

- Giao diện đã làm đủ các luồng ở mục 2 nhưng chạy trên **dữ liệu giả** trong `src/lib/mock/`. Đăng nhập Google/GitHub, kiểm key và câu trả lời của agent đều là giả lập. Dữ liệu chỉ nằm trong bộ nhớ máy chủ, khởi động lại là về ban đầu.
- Dữ liệu demo có 2 tài khoản:
  - **Lan** (GitHub `lan-pham`): chủ workspace chung "Đồ án Kiểm chứng", mã tham gia `KC26DAX`.
  - **Trang** (Google `trang@example.edu`): chỉ có workspace riêng với một hội thoại và một highlight, dùng để demo nhập mã rồi chờ Lan duyệt.
- Chuyển sang backend thật theo ba bước:
  1. Tách lớp dữ liệu thành các hàm bất đồng bộ.
  2. Thêm bản gọi FastAPI, bật bằng biến môi trường.
  3. Thay dần từng phần khi backend có endpoint.

Chạy thử:

```bash
pnpm install
pnpm dev
```

Kiểm tra trước khi gộp:

```bash
pnpm check
```

## 7. Ngoài phạm vi

Tiện ích trình duyệt, đăng nhập bằng tài khoản của nhà cung cấp LLM thay cho API key, công cụ của agent (chạy code, duyệt web), tải tệp và ảnh vào chat, nhiều key cho cùng một nhà cung cấp.
