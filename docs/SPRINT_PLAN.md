# SpecGate Workspace - Kế hoạch sprint (2 người làm web, 3 tuần)

Đi kèm `SpecGate_Workspace_De_xuat_cong_nghe.pdf` (v3.0), `SCRIPT4_PHAN_HOI.md` và `SRS.md` (bản 0.2, theo mô hình ngữ cảnh của trưởng nhóm ngày 13/11). Số trong ngoặc như (PDF 5.5) trỏ tới mục tương ứng của tài liệu PDF. Chỗ nào PDF khác SRS 0.2 (agent theo vai của workspace, trần chi phí, gọi `@agent` trong kênh) thì theo SRS.

- **Hình thức:** một sprint Scrum duy nhất dài 3 tuần, có ba mốc kiểm cuối mỗi tuần.
- **Thời gian:** 16/11/2026 (thứ Hai) đến 04/12/2026 (thứ Sáu). 15 ngày làm việc, ký hiệu N1 đến N15.
- **Nhân sự:** 2 người làm website, mỗi người 15 ngày công (nc), tổng 30 nc.
- **Ngoài phạm vi của nhóm:** mô-đun ADOM (pipeline của bài báo, chạy thí nghiệm, sinh số liệu) do nhóm khác làm. Website chỉ nối với ADOM qua hợp đồng dữ liệu (mục 4, việc A02).
- **Mã nguồn:**
  - `web_ui/`: Next.js. Đã có prototype giao diện chạy trên dữ liệu giả.
  - `api/`: FastAPI của workspace, nhóm web viết mới.
  - `backend/`: backend của ADOM, thuộc nhóm ADOM. Nhóm web không sửa thư mục này; chỉ chép cách gọi LLM của `backend/app/llm.py` sang cổng LLM của `api/`.

## 1. Mục tiêu sprint

> Cuối N15 có một bản chạy trên máy chủ của **workspace nhiều người, mỗi người một agent riêng**:
> - mỗi người có một workspace riêng để chat với agent riêng bằng API key của mình; hội thoại gắn được workspace chung làm ngữ cảnh nhóm;
> - câu trả lời của agent gửi thẳng vào kênh chung dưới tên "agent của ai", không phải copy-dán;
> - mỗi người highlight tin của người khác trong kênh để agent của mình đọc, kèm tên người nói; agent tự đọc tin của chủ nó;
> - cả nhóm đi trọn vòng đề bài → trao đổi qua agent riêng → chốt/loại có lý do → bản tổng hợp.
>
> Kèm báo cáo kiểm thử cho môn học.

Thứ tự ưu tiên:

| Ưu tiên | Phần | Việc | Tuần |
|---|---|---|---|
| 1 | **Lõi workspace chung** (PDF 5, SRS 0.2) | Đăng nhập, workspace chung, mã tham gia và duyệt, kênh chat realtime, tin của agent ghi rõ của ai, vai trong nhóm, bảng ý tưởng, bộ dựng ngữ cảnh nhóm, lệnh, bản tổng hợp | 1, 2 |
| 2 | **Workspace riêng nhập key** (Script4 ý 1) | Nhập và kiểm key, chat nhiều lượt có stream | 2, đầu 3 |
| 3 | **Ngữ cảnh nhóm và highlight** (trưởng nhóm) | Gắn hội thoại với workspace chung, khung "Agent đang đọc", gửi câu trả lời vào kênh, highlight tin của người khác trong kênh kèm người nói | 3 |
| 4 | **Làm nếu còn thời gian** | Tích hợp số liệu ADOM · Mode 2 · mời qua email/GitHub (mục 7) | 3 |

Sprint đạt khi toàn bộ việc **Must** xong. Việc Must chiếm 29 nc, đệm còn 1 nc (0,5 nc mỗi người). Việc ở ưu tiên 4 chỉ bắt đầu khi mọi việc Must tới ngày đó đã gộp.

## 2. Vai trò

| Mã | Vai chính | Phụ trách | Việc Scrum |
|---|---|---|---|
| **TV1** | Frontend, kiểm thử đầu-cuối, một phần backend | Toàn bộ `web_ui/`; API mã tham gia và yêu cầu tham gia; Playwright; báo cáo kiểm thử | Product Owner: giữ thứ tự ưu tiên, nghiệm thu theo tiêu chí; đầu mối với nhóm ADOM |
| **TV2** | Backend và dữ liệu | Phần còn lại của `api/`: Supabase (schema, RLS, Vault, Realtime), cổng LLM, bộ dựng ngữ cảnh nhóm, workspace riêng, highlight, gửi vào kênh, triển khai | Scrum Master: giữ lịch, chạy họp, áp quy tắc cắt |

Mỗi người viết test cho phần mình và review pull request của người kia. TV1 nhận API yêu cầu tham gia để cân tải: phần backend nặng hơn phần frontend, vì frontend đã có prototype.

## 3. Quy tắc bắt buộc

1. **Đóng băng phạm vi từ cuối N1.** Không thêm việc vào sprint. Ý tưởng mới ghi vào "Danh sách chờ" cuối tệp.
2. **Mỗi người chỉ có một việc đang làm.** Không mở việc mới khi việc hiện tại chưa gộp.
3. **Định nghĩa hoàn thành.** Một việc chỉ tính là xong khi đủ cả năm điều:
   - đã gộp vào `main` qua pull request có người kia duyệt;
   - CI xanh (lint, kiểm kiểu, test);
   - có test đúng loại ghi ở cột "Nghiệm thu";
   - endpoint mới có trong OpenAPI, bảng mới có migration Alembic và policy RLS;
   - không có khóa bí mật trong mã, log hay phản hồi API.
4. **Không phụ thuộc mã của nhóm ADOM.** `api/` không import mã trong `backend/`; bảng của workspace không có khóa ngoại sang bảng ADOM. Mọi dữ liệu ADOM đi qua hợp đồng dữ liệu (A02).
5. **Review trong 24 giờ.** Pull request mở trước 17 giờ phải được duyệt hoặc trả lại trước 17 giờ hôm sau.
6. **Việc trễ quá nửa ngày phải báo ngay** trong buổi họp sáng kế tiếp, kèm đề xuất cắt gì.
7. **Cắt theo mốc, không thương lượng** (mục 8).
8. **Đóng băng mã từ cuối N14.** Sau đó chỉ sửa lỗi chặn demo.
9. **Họp:** 15 phút mỗi sáng. Cuối N5, N10, N15: demo đúng theo tiêu chí của mốc (30 phút), rồi 15 phút nhìn lại.

## 4. Tuần 1 - Nền tảng (16/11 - 20/11)

| Ngày | Mã | Việc | Người | nc | Cần trước | Nghiệm thu |
|---|---|---|---|---|---|---|
| N1 | A01 | Chốt schema (PDF 9.1, bỏ bảng `agents`; thêm khóa người dùng, hội thoại riêng có `workspace_id`, highlight có người nói, `team_role`, `messages.agent_model`) và danh sách endpoint, viết thành tệp OpenAPI khung | TV1 + TV2 | 0,5 + 0,5 | - | Tệp OpenAPI và sơ đồ bảng đã gộp; cả hai ký duyệt |
| N1 | A02 | Hợp đồng dữ liệu với nhóm ADOM: định dạng ba tệp báo cáo hoặc API chỉ đọc, kèm một bộ dữ liệu mẫu | TV1 (đầu mối) | trong A01 | - | Tệp mô tả và dữ liệu mẫu trong repo, nhóm ADOM xác nhận trước N2 |
| N1 | F01 | Dọn `web_ui/` cho sprint: CI frontend (ESLint, `tsc`, Vitest), client API sinh từ OpenAPI, tách lớp dữ liệu giả sau một interface để thay bằng API thật từng phần | TV1 | 0,5 | - | `pnpm check` xanh trong CI; script cấm mã hex chạy |
| N1 | B01 | Tạo dự án Supabase, bật Auth (Google, GitHub); khởi tạo `api/`: FastAPI, cấu hình, dạng lỗi thống nhất, `/api/health`; CI backend (ruff, mypy, pytest). Làm thử một bảng có RLS và một kênh Realtime | TV2 | 0,5 | - | `/api/health` trả 200; CI xanh; bản thử RLS và Realtime chạy trên Supabase local |
| N2 | F02 | Nối khung (thanh workspace, cột kênh, khung bên) với API; bố cục màn hình hẹp | TV1 | 0,5 | F01 | Vitest cho bố cục; chạy được ở màn hình hẹp |
| N2 | B02 | Lớp dữ liệu: SQLAlchemy async + asyncpg qua pooler, Alembic; migration cho `profiles`, `workspaces` (có đề bài), `workspace_members` (có `team_role`), `channels`, `messages` (có `sender_kind`, `agent_model`); policy RLS | TV2 | 1 | B01 | Migration lên và xuống chạy sạch trên Supabase local |
| N2-N3 | F03 | Đăng nhập Google/GitHub thật qua Supabase Auth thay màn giả lập; đăng xuất; bảo vệ route | TV1 | 1 | B01 | Vitest; người chưa đăng nhập bị chuyển về trang đăng nhập |
| N3 | B03 | Xác thực JWT của Supabase; dependency `require_member(workspace_id, role)`; API tạo và liệt kê workspace, kênh | TV2 | 1 | B02 | Test: token sai, hết hạn, không phải thành viên đều bị từ chối |
| N3 | F11a | Màn nhập key của workspace riêng trên dữ liệu giả: chọn nhà cung cấp, nhập key, chọn mô hình từ danh sách trả về, báo lỗi; giải thích gói thuê bao không phải API key | TV1 | 0,5 | F01 | Vitest; key không hiện lại sau khi lưu, chỉ hiện 4 ký tự cuối |
| N4 | F04 | Chuyển workspace, tạo workspace chung kèm đề bài, danh sách và tạo kênh | TV1 | 0,5 | B03 | Vitest; tạo workspace chung thấy ngay trong danh sách |
| N4, N6 | F05 | API mã tham gia và yêu cầu tham gia: sinh mã 7 ký tự, chủ đổi mã, nhập mã tạo yêu cầu, duyệt, từ chối, hủy; bảng `join_requests` và RLS | TV1 | 1 | B03 | Test máy trạng thái: pending → approved / rejected / cancelled; không chuyển ngược; mã cũ hết hiệu lực khi chủ đổi |
| N4 | B04 | API gửi tin nhắn; khung bộ phân tích tin nhắn; test phân quyền theo bảng quyết định (3 vai × đọc/ghi) cho RLS và `require_member` | TV2 | 1 | B03 | pytest trên Supabase local: người ngoài không đọc, không ghi được |
| N5 | F06 | Giao diện chat kênh chung: danh sách tin, ô soạn, nhận tin qua Realtime, trạng thái đang tải và lỗi | TV1 | 1 | B04 | Hai trình duyệt thấy tin nhắn của nhau trong vòng 2 giây |
| N5 | B05 | Cổng LLM bằng LiteLLM (stream, đếm token, ước tính chi phí); agent giả tất định cho dev và CI, nhận ngữ cảnh và trả lời theo người nói để kiểm được; khung lưu key người dùng trong Vault (chỉ ghi) | TV2 | 1 | B03 | Test: phản hồi API không bao giờ chứa key; agent giả trả lời tất định |

**Mốc M1 (cuối N5).** Demo đạt khi cả ba điều đúng:
1. Hai tài khoản đăng nhập bằng Google hoặc GitHub thật, vào cùng một workspace chung, nhắn tin thời gian thực.
2. Workspace riêng của mỗi người thì người kia không thấy (có test RLS).
3. Cổng LLM trả lời qua agent giả, có stream.

## 5. Tuần 2 - Lõi lên ý tưởng và workspace riêng (23/11 - 27/11)

| Ngày | Mã | Việc | Người | nc | Cần trước | Nghiệm thu |
|---|---|---|---|---|---|---|
| N6 | F07 | Giao diện tham gia: nhập mã (thanh trái và trang Khám phá), trang đang chờ duyệt tự chuyển khi được duyệt, danh sách chờ duyệt và lịch sử cho chủ | TV1 | 0,5 | F05 | Vitest |
| N6 | B06 | Bảng ý tưởng: bảng `board_items` (ý tưởng, ghi chú, câu hỏi, tóm tắt), máy trạng thái của ý tưởng. Bộ dựng ngữ cảnh nhóm (SRS FR-26) theo từng người hỏi: đề bài, đội (vai, mô hình agent), ý đã chốt/loại, tin của người hỏi và agent của họ; ngân sách token, cắt tin cũ của người hỏi trước; có chỗ cho khối highlight (B11) | TV2 | 1 | B05 | Hypothesis: không vượt ngân sách; khối đề bài và ý đã chốt/loại không bị cắt; giữ thứ tự tin; không có tin nào của người khác ngoài highlight |
| N7 | F08 | Trang thành viên workspace chung: đề bài, mã tham gia, bảng đội (quyền, vai trong nhóm, agent riêng; không hiện key của ai) | TV1 | 0,5 | B05 | Vitest; không có key nào trong dữ liệu trang |
| N7 | F12a | Trang chat workspace riêng trên dữ liệu giả: danh sách hội thoại, khung chat, stream | TV1 | 0,5 | F01 | Vitest |
| N7 | B07 | Tin của agent riêng và vai trong nhóm: API đặt `team_role` của chính mình; tin `sender_kind=agent` lưu chủ agent và `agent_model`, chỉ chủ agent tạo được; lệnh trong tin của agent không thực thi; `/summarize` chạy bằng agent và key của chủ workspace qua cổng LLM, ghi `usage_ledger` | TV2 | 1 | B06 | Test: không sửa được vai người khác; không đăng được tin dưới tên agent người khác; `/decide` trong tin agent bị bỏ qua |
| N8 | F09 | Kênh chung: gợi ý `@` (người) và `/`, phân biệt người, agent ("&lt;mô hình&gt; của &lt;tên&gt;") và hệ thống; danh sách agent của thành viên ở cột trái; kênh không có agent tự trả lời | TV1 | 1 | B07 | Vitest; nhắc tên không tạo lời gọi mô hình |
| N8 | B08 | Lệnh của lõi: `/idea`, `/pin`, `/note`, `/decide` (chỉ người gửi được, bắt buộc lý do), `/summarize` và `/brief` (**chỉ chủ workspace**), `/help`; API bảng ý tưởng | TV2 | 1 | B06 | Hypothesis: bộ phân tích không ném lỗi với chuỗi bất kỳ; test máy trạng thái: agent không chốt được, không chuyển ngược từ đã chốt; thành viên thường gọi `/brief` bị từ chối |
| N9 | F10 | Bảng ý tưởng theo cột (đề xuất, đang bàn, đã chốt, đã loại; không tô màu trạng thái theo Script3); đưa tin lên bảng (kể cả tin của agent, ghi "Agent của &lt;tên&gt;"); chốt và loại kèm lý do; bản tổng hợp chỉ chủ tạo, mọi người xem và tải | TV1 | 0,5 | B08 | Vitest; ý vừa chốt chuyển cột ngay ở cả hai trình duyệt |
| N9 | B09 | Workspace riêng phần 1: lưu key của người dùng trong Vault (chỉ ghi), kiểm key bằng endpoint liệt kê mô hình của nhà cung cấp, trả danh sách mô hình; hai bộ chuyển đổi (Anthropic, kiểu OpenAI) | TV2 | 1 | B05 | Test: key không có trong phản hồi, log, lỗi; key sai, hết hạn mức (401, 429) trả câu cố định |
| N9-N10 | F13 | Highlight trong kênh chung: bôi đen trong tin của người khác, nút "Highlight cho agent của tôi", chọn nhãn, xem và sửa văn bản kèm tên người nói; tin của mình chỉ hiện lời nhắc; vệt phấn chỉ người tạo thấy; danh sách "Highlight của tôi" nhóm theo workspace (lưu qua API ở B11, trước đó dùng dữ liệu giả) | TV1 | 1 | F09 | Vitest; bôi đen trên danh sách đánh số vẫn lưu được văn bản đọc được |
| N10 | F11b | Nối màn nhập key với API (B09) | TV1 | 0,5 | B09 | Vitest |
| N10-N11 | B10 | Workspace riêng phần 2: bảng hội thoại và lượt chat; chat nhiều lượt có stream qua SSE bằng key của người dùng; cắt lượt cũ khi vượt cửa sổ ngữ cảnh | TV2 | 1,5 | B09 | Test tích hợp với nhà cung cấp giả; hội thoại dài không vượt ngân sách; người khác không đọc được hội thoại (RLS) |

**Mốc M2 (cuối N10).** Demo trên một đề bài **không liên quan tới ADOM** (ví dụ "chọn đề tài đồ án"), đạt khi cả sáu điều đúng:
1. Người thứ hai vào workspace chung bằng mã tham gia và được chủ duyệt; mỗi người ghi vai trong nhóm của mình.
2. Bộ dựng ngữ cảnh nhóm cho mỗi người đúng FR-26 (test với agent giả): có đội và vai, ý đã loại kèm lý do, đủ tin của người hỏi, không có tin nào của người khác.
3. Một ý được chốt và một ý bị loại, mỗi cái kèm lý do; bảng cập nhật ở cả hai trình duyệt.
4. Chủ chạy `/summarize`, kết quả hiện dưới tên agent của chủ; thành viên thường không chạy được `/summarize`, `/brief`.
5. Chủ xuất `/brief`; mọi thành viên tải được Markdown.
6. Ở workspace riêng, nhập key thật được kiểm, chọn được mô hình, sau khi lưu chỉ còn hiện 4 ký tự cuối.

## 6. Tuần 3 - Ngữ cảnh nhóm, highlight, hoàn thiện, bàn giao (30/11 - 04/12)

| Ngày | Mã | Việc | Người | nc | Cần trước | Nghiệm thu |
|---|---|---|---|---|---|---|
| N11 | F12b | Nối trang chat workspace riêng với API (B10): nhiều lượt, stream, lịch sử | TV1 | 0,5 | B10 | Vitest; thấy chữ chạy với nhà cung cấp giả |
| N11-N12 | B11 | Ngữ cảnh nhóm và highlight: bảng `highlights` (người tạo, workspace, kênh, `source_message_id`, người nói chụp lại, bản chụp văn bản, nhãn), chặn highlight tin của mình, RLS chỉ người tạo đọc; `conversations.workspace_id` và API gắn/bỏ gắn; nạp ngữ cảnh nhóm (B06) kèm highlight "chưa chốt" và người nói vào chat riêng (B10); API gửi câu trả lời (lượt assistant của hội thoại đã gắn) vào kênh | TV2 | 1,5 | B06, B07, B10 | Test tích hợp: prompt chứa đúng đoạn highlight, người nói và nhãn "chưa chốt"; người khác không đọc được highlight; không gửi được lượt của người dùng hay hội thoại của người khác; xóa hội thoại riêng thì highlight và tin đã gửi vẫn còn |
| N11-N12 | F14 | Ngữ cảnh nhóm ở workspace riêng: ô chọn workspace (cả ở hội thoại mới), khung "Agent đang đọc" (vai sửa được, đội, ý chốt/loại, tin của mình, highlight bỏ được); "Gửi vào kênh" dưới câu trả lời và khi bôi đen, hộp thoại sửa nội dung và chọn kênh; nối API B11 | TV1 | 1,5 | B11, F13 | Vitest; tin gửi hiện trong kênh dưới tên "&lt;mô hình&gt; của &lt;tên&gt;" |
| N13 | B12 | Triển khai: `api/` bằng Docker trên VPS, `web_ui/` trên Vercel | TV2 | 0,5 | - | `/api/health` trả 200 từ địa chỉ công khai |
| N13 | F16 | Hoàn thiện giao diện: trạng thái rỗng và lỗi, bàn phím, độ tương phản | TV1 | 0,5 | - | Danh sách kiểm tra giao diện |
| N13-N14 | B13 | Schemathesis cho toàn bộ OpenAPI; rà soát bảo mật theo bảng PDF 10 (thêm: key người dùng, quyền đọc hội thoại riêng và highlight, đăng tin dưới tên agent người khác); triển khai bản ứng viên | TV2 | 1 | tất cả | Không có lỗi 500 từ Schemathesis; danh sách kiểm tra bảo mật có bằng chứng |
| N13-N14 | F15 | Ba kịch bản Playwright: (1) dựng khung và runner: A hỏi agent riêng, gửi vào kênh; B highlight, hỏi agent của B, gửi lại; một ý được chốt, xuất `/brief`; (2) tham gia bằng mã rồi được duyệt; (3) A highlight tin của B và của agent B, agent giả của A trả lời nêu đúng người nói | TV1 | 1 | F10, F07, F14 | Cả ba xanh trong CI |
| N14 | - | Đệm | TV1 + TV2 | 0,5 + 0,5 | - | - |
| N15 | R01 | Kiểm tra khói trên môi trường chung; sửa lỗi chặn demo | TV1 + TV2 | 0,5 + 0,5 | B13 | Kịch bản khói chạy hết |
| N15 | R02 | Báo cáo kiểm thử cho môn học (bảng truy vết yêu cầu → ca thử, kết quả từng kỹ thuật, độ phủ); README chạy local; diễn tập demo | TV1 + TV2 | 0,5 + 0,5 | R01 | Báo cáo và README đã gộp; demo diễn tập một lần trọn vẹn |

**Mốc M3 (cuối N15).** Sprint đạt khi:
1. Trên máy chủ: hai người, mỗi người một agent riêng của hai nhà cung cấp khác nhau, trao đổi trọn một vòng qua kênh mà không copy-dán; ít nhất một highlight được agent của người highlight dùng và nêu đúng người nói.
2. Ba kịch bản Playwright xanh; độ phủ các module lõi (tin nhắn, bảng ý tưởng, ngữ cảnh nhóm, phân quyền, workspace riêng, highlight) từ 80%.
3. Báo cáo kiểm thử và README đã có trong repo.
4. Demo đã diễn tập.

## 7. Làm nếu còn thời gian

Chỉ bắt đầu khi mọi việc Must tới ngày đó đã gộp. Thứ tự cố định:

| Thứ tự | Mã | Việc | nc | Ghi chú |
|---|---|---|---|---|
| 1 | S1 | Tích hợp số liệu ADOM: bảng số liệu (giao diện đã có trong prototype) nối dữ liệu theo A02; lệnh `/stats`, `/task`, thẻ số liệu và chip tham chiếu trong kênh; nhãn `invalidated` đi theo mọi con số | 2 | Chuyển thành Must nếu nhóm ADOM không tự làm trang số liệu (mục 11, câu 3) |
| 2 | S2 | Mode 2 bản rút gọn: chia sẻ bản chụp hội thoại riêng vào kênh chung, chọn lượt bằng ô đánh dấu, giới hạn số lượt | 1,5 | Cần chốt giới hạn số lượt trước khi làm |
| 3 | S3 | Mời qua email và GitHub (Script3); vẫn giữ mã tham gia | 1,5 | |
| 4 | S4 | Mode 2: tóm tắt hội thoại bằng agent trước khi đưa vào ngữ cảnh | 1,5 | Cần S2 |

## 8. Phân bổ ngày công

| | Tuần 1 | Tuần 2 | Tuần 3 | Tổng Must | Đệm |
|---|---|---|---|---|---|
| **TV1** | 5 | 5 | 4,5 | 14,5 | 0,5 |
| **TV2** | 5 | 5 | 4,5 | 14,5 | 0,5 |

Theo phần:

| Phần | nc |
|---|---|
| Lõi workspace chung | 23 |
| Giao diện đã có prototype (F02, F04, F07, F08, F10 mỗi việc còn nửa ngày) | −2,5 |
| Workspace riêng nhập key (F11, F12, B09, B10) | 4,5 |
| Ngữ cảnh nhóm và highlight (F13, F14, B11) | 4 |
| **Tổng Must** | **29** |

So với kế hoạch cũ: các việc ADOM (nhập báo cáo, bảng số liệu, `/stats`, `/run`, nút "Thảo luận") đã chuyển cho nhóm ADOM hoặc xuống mục 7. Gói ngữ cảnh khi xin tham gia bỏ hẳn.

Đổi theo mô hình của trưởng nhóm (13/11): bỏ agent theo vai của workspace, quản lý agent, trần chi phí, gọi `@agent` trong kênh, hàng đợi và luật agent gọi agent (B05, B07, F08, F09 cũ). Phần công đó chuyển sang tin của agent riêng và vai trong nhóm (B07 mới), bộ dựng ngữ cảnh theo người hỏi (B06), highlight trong kênh (F13), ngữ cảnh nhóm và gửi vào kênh (B11, F14). Tổng Must giữ 29 nc.

## 9. Quy tắc cắt

Đệm chỉ có 1 nc, nên mọi việc ở mục 7 coi như chưa có trong lịch. Khi Must trễ, cắt theo bảng sau:

| Thời điểm | Điều kiện | Hành động | Ngày công thu lại |
|---|---|---|---|
| Cuối N5 | M1 không đạt đủ ba điều | Dùng đệm; không bắt đầu việc nào ở mục 7 trong cả sprint | 1 |
| Cuối N10 | M2 không đạt đủ sáu điều, hoặc F13 chưa gộp | Highlight lùi về **highlight cả tin nhắn**: bỏ bôi đen một đoạn trong F13 | khoảng 0,5 (TV1) |
| Cuối N12 | B11 hoặc F14 chưa gộp | Bỏ "Gửi đoạn bôi đen" (chỉ gửi cả câu trả lời) và bỏ khung "Agent đang đọc" (chỉ giữ ô chọn workspace); highlight và tin của mình vẫn nạp vào ngữ cảnh | khoảng 0,5 (TV1 + TV2) |
| Bất kỳ lúc nào | Một người nghỉ từ 1 ngày | Hết đệm thì cắt theo thứ tự: `/summarize` (giữ `/brief`), rồi trang Khám phá (chỉ giữ nhập mã ở thanh trái) | 0,5 mỗi mức |

Không cắt phần còn lại của Must. Nếu đã cắt hết các mức trên mà Must vẫn trễ, hai người dừng lại cùng xếp lại thứ tự và báo người hướng dẫn trong ngày.

## 10. Đường găng

```
A01 ─► B02 ─► B03 ─► B04 ─► F06                                 (M1)
              B03 ─► B05 ─► B06 ─► B07 ─► B08 ─► F10             (M2, lõi lên ý tưởng)
                     B05 ─► B09 ─► B10 ─► F12b                   (workspace riêng)
                  B06 + B07 + B10 ─► B11 ─► F14 ─► F15           (ngữ cảnh nhóm, M3)
              B03 ─► F05 ─► F07 ─► F15
```

B02 và B03 chặn gần như mọi việc khác; phải xong đúng N2 và N3. Chuỗi B05 → B06 → B07 → B08 → F10 là xương sống của sản phẩm. B11 cần bộ dựng ngữ cảnh (B06), tin của agent (B07) và hội thoại riêng (B10), nên là điểm dễ trễ nhất của tuần 3. Vì "gửi vào kênh" chỉ có ở tuần 3, mốc M2 kiểm ngữ cảnh nhóm bằng test với agent giả thay vì demo trọn vòng.

## 11. Rủi ro theo dõi trong họp sáng

| Rủi ro | Dấu hiệu sớm | Người theo dõi | Phản ứng |
|---|---|---|---|
| Một người nghỉ | Vắng họp sáng | Người còn lại | Áp dòng cuối mục 9 ngay hôm đó |
| Supabase lần đầu dùng | Bản thử RLS hoặc Realtime ở B01 chưa chạy cuối N2 | TV2 | Dừng việc khác, cả hai cùng gỡ trong N3 |
| RLS sai | Test phân quyền B04 đỏ hoặc chưa có | TV2 | Không gộp policy thiếu test |
| Realtime không ổn | Tin mới đến trễ trên 2 giây ở N5 | TV2 | Lùi về làm mới định kỳ cho kênh; stream chỉ cần ở chat riêng (SSE) |
| Bôi đen trên tin nhiều phần khó | F13 chưa ổn giữa N10 | TV1 | Áp dòng "cuối N10" của mục 9 ngay |
| Ngữ cảnh nhóm phình to | Prompt vượt ngân sách khi một người nhắn nhiều | TV2 | Áp giới hạn số tin của mình (SRS mục 8, câu 4), cắt tin cũ trước |
| Nhóm ADOM trễ dữ liệu | A02 chưa xác nhận cuối N2 | TV1 | Làm S1 trên số liệu MAIN đang có trong `web_ui/src/lib/mock/` |
| Chi phí LLM | Sổ mức dùng tăng khi dev | TV2 | Agent giả là mặc định; mỗi người tự chịu key của mình |
| Triển khai gặp sự cố | B12 chưa xong cuối N13 | TV2 | Dùng đệm N14 |

## 12. Việc phải chốt trước sáng N1

1. Gán tên thật vào TV1 và TV2.
2. Ai giữ quyền chủ dự án Supabase, Vercel và VPS.
3. Nhóm ADOM có tự làm trang hiển thị số liệu không. Nếu không, S1 thành Must; khi đó cắt trang Khám phá để bù.
4. Key LLM dùng khi demo: mỗi người một key của mình, nên chuẩn bị hai key của hai nhà cung cấp khác nhau (ví dụ Anthropic và DeepSeek).
5. Đề bài dùng cho buổi demo lõi (mốc M2).
6. Tên sản phẩm ("SpecGate Workspace" đang là tên tạm).

## 13. Danh sách chờ (ngoài sprint này)

Agent tự trả lời trong kênh khi được gọi tên · token cho agent bên ngoài · tiện ích trình duyệt · tải tệp và ảnh trong workspace riêng · công cụ của agent (tool use) · hỏi đáp trên tài liệu tải lên (pgvector) · mô-đun dữ kiện thứ hai · so sánh hai lượt chạy, xuất CSV/LaTeX · MCP server · vai trò viewer · trang mức dùng chi tiết.
