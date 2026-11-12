# Luồng giao diện và những gì phải có trên UI

Rút từ `SpecGate_Workspace_De_xuat_cong_nghe.pdf` (mục 4, 5, 7.2, 10), `spec.md` (Script2, Script3, Script4), `SCRIPT4_PHAN_HOI.md`, `SPRINT_PLAN.md` và mô hình ngữ cảnh của trưởng nhóm (13/11, xem `SRS.md` mục 10). Chỗ nào các nguồn cũ xung đột với mô hình của trưởng nhóm thì theo trưởng nhóm. Dùng làm danh sách đối chiếu khi làm các việc trong `SPRINT_PLAN.md`. Cột "Màn" trỏ tới `prototype.pdf` (v2); màn chưa có trong prototype ghi "mới".

Phạm vi: nhóm web (2 người) làm toàn bộ website. Mô-đun ADOM do nhóm khác làm; các màn số liệu (12–15) chỉ là phần tích hợp, làm nếu còn thời gian (việc S1).

## 1. Luồng chính

**Đăng nhập (Script2):** Đăng nhập Google hoặc GitHub (01) → vào workspace riêng (02). Chưa có key thì hiện ô nhập key; chưa thuộc workspace chung nào.

**Đăng ký (chưa có tài khoản):** Trang đăng nhập (01) chọn "Tạo tài khoản" → "Đăng ký với Google" hoặc "Đăng ký với GitHub" → nhà cung cấp trả về email Google hoặc tên GitHub và tên hiển thị → hệ thống tạo tài khoản và workspace riêng → màn nhập key kèm lời chào. Tài khoản Google/GitHub đã đăng ký thì được đăng nhập luôn, không tạo trùng. Bản giao diện giả lập bước của nhà cung cấp bằng một form; khi nối Supabase Auth, form này bỏ đi.

**Workspace riêng (Script4 ý 1):** Nhập API key của một nhà cung cấp → hệ thống kiểm key và trả danh sách mô hình → chọn mô hình (đây là agent riêng của người dùng) → chat nhiều lượt như một trang LLM, câu trả lời stream. Workspace riêng chỉ có hội thoại với agent: không có kênh, bảng ý tưởng hay thành viên.

**Gắn ngữ cảnh nhóm (trưởng nhóm):** Trong hội thoại riêng, chọn workspace chung ở ô "Ngữ cảnh nhóm" (hội thoại mới chọn ở ô hỏi) → khung "Agent đang đọc" bên phải hiện vai của mình (sửa được), đội và agent từng người, số ý đã chốt/loại, tin của mình trong kênh (tự đọc), các đoạn đã highlight kèm người nói → mỗi câu hỏi tiếp theo gửi kèm phần này.

**Gửi câu trả lời vào kênh (trưởng nhóm, thay cho copy-paste):** Trong hội thoại đã gắn, bấm "Gửi vào kênh" dưới câu trả lời hoặc bôi đen một đoạn rồi bấm "Gửi đoạn này vào kênh" → sửa (lọc bớt), chọn kênh → tin hiện trong kênh dưới tên `<mô hình> của <tên>`.

**Highlight trong kênh chung (trưởng nhóm, thay cho Script4 Mode 1):** Trong kênh, bôi đen một đoạn trong tin của người khác hoặc agent của người khác → "Highlight cho agent của tôi" → chọn nhãn *quan trọng* hoặc *cần xem xét* → đoạn vào "Highlight của tôi" và ngữ cảnh agent riêng, kèm người nói → ở hội thoại riêng, agent trả lời theo người nói ("Long nói… chưa chính xác vì…"). Bôi đen tin của mình thì chỉ hiện lời nhắc "đã tự vào ngữ cảnh".

**Chia sẻ cả hội thoại (Script4 Mode 2, việc S2, làm nếu còn thời gian):** Trong workspace riêng bấm "Chia sẻ hội thoại" → chọn lượt bằng ô đánh dấu (có giới hạn số lượt) → xem trước → gửi bản chụp vào kênh chung.

**Tham gia workspace chung bằng mã (Script2):** Thành viên bấm Chia sẻ mã tham gia, hệ thống sinh mã 7 ký tự → người nhận nhập mã (thanh trái hoặc trang Khám phá) → trang Đang chờ duyệt → chủ duyệt (10) → tự vào workspace chung.

**Tham gia qua Khám phá (PDF 5.3):** Tìm workspace chung công khai (09) → xin tham gia kèm lời nhắn → chủ duyệt hoặc từ chối (10). Gói ngữ cảnh đính kèm đã bỏ; thay bằng highlight sau khi vào workspace.

**Vòng làm việc trong workspace chung:** Đặt đề bài (03) → mỗi người hỏi agent riêng ở workspace riêng → gửi câu trả lời vào kênh (04) → người khác highlight đoạn cần phản hồi, hỏi agent riêng của họ, gửi lại vào kênh → ý vào bảng bằng `/idea`, `/pin` (06) → Chốt (07) → Xuất (08, chủ thực hiện).

**Một câu hỏi của hội thoại gắn workspace chung:** gửi câu hỏi → backend kiểm chủ hội thoại và quyền thành viên → dựng ngữ cảnh nhóm (đề bài, đội và vai, ý đã chốt/loại, tin của mình, highlight của mình kèm người nói) → gọi mô hình bằng key của người hỏi → stream về hội thoại riêng. Không có gì đi vào kênh cho tới khi người dùng bấm "Gửi vào kênh".

**Tích hợp ADOM (PDF 6.5, việc S1, làm nếu còn thời gian):** Dữ liệu từ nhóm ADOM theo hợp đồng A02 → bảng số liệu (13, 14) → `/stats`, `/task`, chip tham chiếu trong kênh (15).

## 2. Danh sách kiểm theo màn

| Màn | Phải có | Mức | Việc |
|---|---|---|---|
| 01 Đăng nhập / đăng ký | Chỉ Google và GitHub; không có mật khẩu; hai chế độ Đăng nhập và Tạo tài khoản; tài khoản mới có sẵn workspace riêng rồi sang màn nhập key | Must | F03 |
| 02 Workspace riêng | Trang chat với agent; danh sách hội thoại (hội thoại gắn workspace chung có biểu tượng riêng); chat nhiều lượt có stream; không có kênh, bảng, thành viên; lối sang workspace chung (nhập mã, Khám phá, tạo mới) | Must | F12, B10 |
| Ngữ cảnh nhóm (mới) | Ô chọn workspace chung ở đầu hội thoại và ở ô hỏi của hội thoại mới; khung "Agent đang đọc": vai của mình (sửa được), đội và agent, số ý chốt/loại, tin của mình, highlight kèm người nói (bỏ được) | Must | F12, B10 |
| Gửi vào kênh (mới) | Nút "Gửi vào kênh" dưới câu trả lời; bôi đen để gửi một đoạn; hộp thoại sửa nội dung, chọn kênh, ghi rõ tên agent sẽ hiện | Must | F12, F06 |
| Nhập key (mới) | Chọn nhà cung cấp; nhập key; kiểm key ngay và báo lỗi dễ hiểu (key sai, hết hạn mức); chọn mô hình từ danh sách trả về; key chỉ ghi, chỉ hiện 4 ký tự cuối; ghi rõ gói thuê bao (ChatGPT Plus, Claude Pro…) không phải API key | Must | F11, B09 |
| Highlight (mới) | Bôi đen trong tin của người khác ở kênh chung; nút "Highlight cho agent của tôi"; chọn nhãn *quan trọng* / *cần xem xét*; xem và sửa văn bản, thấy tên người nói; vệt phấn chỉ người tạo thấy; tin của mình chỉ hiện lời nhắc; danh sách "Highlight của tôi" nhóm theo workspace | Must | F13, B11 |
| Mã tham gia | Mã 7 ký tự hệ thống sinh; thành viên chia sẻ, chủ đổi mã; nhập mã tạo yêu cầu chờ duyệt; trang chờ tự chuyển khi được duyệt; hủy yêu cầu | Must | F05, F07 |
| Khung | Thanh workspace (riêng, các workspace chung, tạo mới, tìm), cột điều hướng của workspace chung (đề bài, kênh, bảng ý tưởng, agent riêng của các thành viên), khung bên bảng ý tưởng; đăng xuất | Must | F02 |
| 03 Tạo workspace chung | Tên, đề bài bắt buộc, hiển thị (ẩn / ai cũng tìm thấy); ghi rõ mỗi thành viên mang agent riêng | Must | F04 |
| 04 Kênh chat | Tin của người, agent (mô hình + "của <tên>"), hệ thống; Realtime < 2 s; trạng thái tải và lỗi; tạo kênh mới | Must | F06, F04 |
| 05 `@` và `/` | Gợi ý người, lệnh lõi; bàn phím | Must | F09 |
| 06 Bảng ý tưởng | Bốn cột trạng thái, không tô màu theo trạng thái (Script3); ghi chú; câu hỏi mở (mở → đã trả lời); tóm tắt cuộn; nguồn của mỗi thẻ (tin của người hoặc agent của ai); cột đã loại không ẩn | Must | F10 |
| 07 Chốt / loại | Chỉ người; lý do bắt buộc; không quay ngược; lệnh tương đương `/decide` | Must | F10 |
| 08 Bản tổng hợp | Chỉ chủ tạo (`/summarize`, `/brief`); mọi thành viên xem và tải Markdown; gồm chốt, loại kèm lý do, đang bàn, câu hỏi mở | Must | F10, B08 |
| 09 Tìm và xin tham gia | Danh sách workspace công khai, tìm theo tên/đề bài, trạng thái quan hệ; lời nhắn | Must | F07 |
| 10 Duyệt yêu cầu | Chỉ chủ thấy; duyệt; từ chối; lịch sử đã xử lý | Must | F07 |
| 11 Thành viên và agent | Bảng đội: quyền chủ/thành viên, vai trong nhóm, agent riêng (mô hình, nhà cung cấp) hoặc "chưa nhập key"; không hiện key của ai; sửa đề bài; mã tham gia | Must | F08 |
| Chia sẻ hội thoại (mới) | Chọn lượt bằng ô đánh dấu; giới hạn số lượt; xem trước; thẻ hội thoại trong kênh mở được toàn văn bản chụp | Làm thêm | S2 |
| Mời qua email / GitHub | Nhập email hoặc tên GitHub; lời mời vẫn đi qua bước chủ duyệt | Làm thêm | S3 |
| 12–15 Số liệu ADOM | Bảng số liệu sáu tiêu chí, kết quả theo tác vụ, thẻ `/stats` và `/task`, chip tham chiếu; nhãn `invalidated` đi theo mọi con số. Dữ liệu từ nhóm ADOM | Làm thêm (Must nếu nhóm ADOM không tự làm trang số liệu) | S1 |

## 3. Quy tắc phải thấy được trên UI

- **Mỗi người một agent riêng, chạy bằng key của chính người đó.** Agent ở workspace riêng và agent gửi tin vào kênh là một; tin của agent luôn ghi "của <tên>".
- **Key chỉ ghi, chỉ hiện 4 ký tự cuối**, và chỉ chủ key thấy.
- **Agent tự đọc tin của chủ nó; tin của người khác phải highlight.** Khung "Agent đang đọc" cho thấy đúng phần này.
- **Highlight không phải là chốt** và chỉ người tạo thấy. Agent nhận đoạn highlight kèm người nói và nhãn "chưa chốt". Chỉ bảng ý tưởng mới có trạng thái đã chốt.
- **Chỉ phần đã gửi vào kênh mới rời workspace riêng.** Không ai mở được hội thoại riêng của người khác.
- **Tổng hợp là quyền của chủ:** `/summarize`, `/brief`. Thành viên thường thấy các lệnh này bị từ chối kèm lý do.
- Kênh không có agent tự trả lời khi được gọi tên.
- Lệnh chỉ thực thi khi do người gửi; agent không chốt được ý.
- Trạng thái trên bảng ý tưởng phân biệt bằng cột và chữ, không bằng màu (Script3).
- Khi có tích hợp ADOM (S1): `INSUFFICIENT_DATA` không bao giờ dùng màu của PASS; trạng thái lượt chạy (invalidated) đi theo mọi con số.

## 4. Prototype cần đổi hoặc chưa có

- **Đổi:** workspace riêng trong prototype đang là một workspace đủ kênh, agent, bảng. Phải đổi thành trang chat với agent (màn 02 ở trên).
- **Đổi:** bỏ gói ngữ cảnh khỏi màn xin tham gia (09) và duyệt (10).
- **Chưa có:** màn nhập key; trang chat workspace riêng; bôi đen và lưu highlight; mục Highlight trong gợi ý `@`; thẻ highlight trong kênh.
- **Chưa có:** trạng thái rỗng, lỗi, đang tải cho từng màn; điều hướng bàn phím đầy đủ; độ tương phản (F16).
- **Chưa có:** bố cục màn hình hẹp (nghiệm thu F02).
- **Đã đổi theo trưởng nhóm (13/11):** bỏ ba agent theo vai, trần chi phí, gọi `@agent` trong kênh; highlight chuyển sang kênh chung; thêm ngữ cảnh nhóm, "Gửi vào kênh", vai trong nhóm.
- **Chưa có:** cắt bớt ngữ cảnh nhóm khi quá lớn (SRS NFR-07).
- **Chưa có:** kết quả `/help`, `/summarize`; hộp thoại tạo kênh mới (nút `+` đã có).

## 5. Ghi chú

- Giao diện dùng chủ đề sáng trắng và xanh dương (thanh workspace xanh đậm, cột và vùng nội dung trắng, một màu nhấn xanh dương; highlight là vệt vàng nhạt dưới chữ). Token màu ở `web_ui/src/app/globals.css`; script xuất prototype dùng cùng bảng màu.
- Script3 đổi logo và bỏ màu trạng thái; Script4 định nghĩa lại workspace riêng và thêm hai mode đưa nội dung vào workspace chung. Lý do và đánh giá khả thi xem `SCRIPT4_PHAN_HOI.md`. Mode 1 của Script4 (highlight ở workspace riêng) đã được mô hình của trưởng nhóm thay bằng "Gửi vào kênh" và highlight trong kênh chung.
- Hai đường tham gia workspace chung (nhập mã, xin qua Khám phá) đều phải chờ chủ duyệt. Không có liên kết mời vào thẳng.
- Chưa chốt: xem `SRS.md` mục 8; giới hạn số lượt của Mode 2.
