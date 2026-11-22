# SpecGate Workspace (Sàng Ý): Kế hoạch kiểm thử

| Mục | Nội dung |
| --- | --- |
| Tài liệu | Test Plan (TP) |
| Phiên bản | 1.1 |
| Ngày | 21/11/2026 |
| Dự án | SpecGate Workspace, website cho nhóm cùng lên ý tưởng với agent AI riêng của từng người |
| Mẫu áp dụng | Cấu trúc Test Plan của môn Kiểm thử phần mềm (UIT, mẫu FPT Software): Giới thiệu, Yêu cầu kiểm thử, Chiến lược kiểm thử, Nguồn lực, Mốc kiểm thử, Sản phẩm bàn giao |
| Căn cứ | [`flow.md`](flow.md), [SRS 0.4](SRS.md), mã nguồn `web_ui/` và `backend/` ở nhánh `dev` |

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Yêu cầu kiểm thử](#2-yêu-cầu-kiểm-thử)
3. [Chiến lược kiểm thử](#3-chiến-lược-kiểm-thử)
4. [Nguồn lực](#4-nguồn-lực)
5. [Mốc kiểm thử](#5-mốc-kiểm-thử)
6. [Sản phẩm bàn giao](#6-sản-phẩm-bàn-giao)
7. [Phụ lục](#7-phụ-lục)

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu xác định phạm vi, cách làm, công cụ, người làm và lịch kiểm thử website SpecGate Workspace. Tài liệu dùng để:

- thống nhất trong nhóm những gì được kiểm thử, ở mức nào, bằng công cụ gì;
- làm căn cứ viết Test Case (TC) và lập Test Report (TR);
- xác định tiêu chí để kết luận website đạt yêu cầu nghiệm thu.

Tài liệu gồm sáu mục theo mẫu: mục 1 giới thiệu, phạm vi, ràng buộc, rủi ro; mục 2 liệt kê yêu cầu cần kiểm thử; mục 3 mô tả chiến lược theo từng loại kiểm thử, các giai đoạn, phần kiểm thử tự động và công cụ; mục 4 nêu nguồn lực con người và hệ thống; mục 5 là mốc và ước lượng công; mục 6 là sản phẩm bàn giao.

### 1.2. Thông tin dự án

Khi một nhóm cùng lên ý tưởng, mỗi người hỏi một agent AI riêng (Claude, DeepSeek, ChatGPT…), và các phiên chat không thấy nhau. Muốn agent hiểu nhóm đang bàn gì, mọi người phải copy và dán qua lại. SpecGate bỏ vòng copy và dán đó:

- trong **workspace riêng**, người dùng chat với agent của mình (bằng API key của mình), highlight đoạn đáng giữ, xem lại rồi mới gửi vào kênh nhóm, ghi rõ lời của agent nào;
- agent của mỗi người tự đọc mọi tin chủ của nó đã nhắn trong kênh nhóm;
- tin của người khác chỉ vào agent của mình khi mình **highlight cho agent**, luôn kèm tên người nói.

**Workspace chung** có đề bài, kênh chat thời gian thực, bảng ý tưởng (Đề xuất, Đang bàn, Đã chốt, Đã loại), và bản tổng hợp.

**Kiến trúc đang chạy**

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | Next.js 16, React 19, TypeScript, Tailwind CSS 4 (`web_ui/`) |
| Máy chủ | FastAPI, SQLAlchemy 2, Python 3.13 (`backend/`), API có phiên bản `/api/v1` |
| CSDL | SQLite khi phát triển; Postgres (Supabase) khi triển khai, xem [supabase-setup.md](supabase-setup.md) |
| Thời gian thực | Server-Sent Events, nối lại bằng `?after=<seq>` |
| Đăng nhập | OAuth Google, GitHub; cookie phiên ký HMAC 30 ngày; màn đăng nhập giả lập khi phát triển |
| Agent | Anthropic hoặc dịch vụ kiểu OpenAI, gọi từ máy chủ bằng key của từng người (lưu mã hóa Fernet); chế độ agent giả `LLM_FAKE=true` |
| Triển khai | Docker Compose, Caddy (HTTPS), GitHub Actions |

### 1.3. Tài liệu tham khảo

| Tài liệu | Dùng để |
| --- | --- |
| [`docs/flow.md`](flow.md) | Mô tả cách website hoạt động, nguồn chính cho kịch bản kiểm thử |
| [`docs/SRS.md`](SRS.md) | 17 ca sử dụng, FR-01 đến FR-110, BR-01 đến BR-33, NFR-01 đến NFR-16; mã luồng A, E dùng làm mã Test Case |
| [`uml/README.md`](../uml/README.md), [`docs/diagram-reading-guide.md`](diagram-reading-guide.md) | Biểu đồ hoạt động, tuần tự, trạng thái của từng luồng: căn cứ thiết kế test theo luồng và theo chuyển trạng thái |
| [`backend/WORKSPACE_API.md`](../backend/WORKSPACE_API.md), Swagger tại `/docs` | Hợp đồng API cho kiểm thử API và kiểm thử theo hợp đồng |
| [`docs/checklist.md`](checklist.md) | Danh sách kiểm tra thủ công hiện có |
| [`AGENTS.md`](../AGENTS.md) | Quy ước mã, lệnh chuẩn `test`, `test:e2e`, Definition of Done |
| Bài giảng "Test Plan" (UIT, cập nhật 03/2014) | Cấu trúc và checklist rà soát Test Plan |

### 1.4. Phạm vi kiểm thử

#### 1.4.1. Các giai đoạn kiểm thử

| Giai đoạn | Đối tượng | Người làm | Tự động |
| --- | --- | --- | --- |
| Unit test | Hàm và thành phần giao diện riêng lẻ (Vitest); hàm nghiệp vụ ở máy chủ (pytest) | Lập trình viên | Có |
| Integration test | Từng đường API cùng CSDL và agent giả (pytest + TestClient); kiểm thử theo hợp đồng OpenAPI | Lập trình viên, Tester | Có |
| System test | Toàn website trên trình duyệt thật, nhiều người dùng cùng lúc (Playwright); phi chức năng (hiệu năng, tải, bảo mật, giao diện) | Tester | Phần lớn có |
| Acceptance test | "Vòng làm việc mẫu" 10 bước của `flow.md` với hai người, hai agent khác nhau | Cả nhóm, giảng viên | Có kịch bản tự động và một lượt chạy thủ công |

#### 1.4.2. Các loại kiểm thử

Function test, User interface test, Data and database integrity test, Business cycle test, Performance profiling, Load test, Stress test, Volume test, Security and access control test, Regression test. Chi tiết từng loại ở mục 3.1.

#### 1.4.3. Giả định

- Kiểm thử chạy với agent giả (`LLM_FAKE=true`), để kết quả lặp lại được và không tốn tiền. Agent giả có quy tắc tạo lỗi cố định: key ngắn hơn 20 ký tự là key sai, key kết thúc bằng `0000` là hết hạn mức, câu hỏi kết thúc bằng `[fake-error]` làm nhà cung cấp lỗi giữa chừng.
- Đăng nhập trong kiểm thử dùng phiên giả lập (`AUTH_DEV_LOGIN=true`, `POST /api/v1/auth/dev-sessions`), không cần tài khoản Google, GitHub thật. Tài khoản đã có trong dữ liệu mẫu đăng nhập không cần mã; tạo tài khoản mới phải qua mã email, nên kiểm thử thay hàm gửi thư bằng bản giả (`monkeypatch` `mailer.send_login_code`, hoặc máy SMTP giả như MailHog trong kiểm thử đầu-cuối) để đọc mã. Luồng OAuth thật và gửi thư thật qua Gmail được kiểm một lần bằng tay trên môi trường staging.
- Dữ liệu mẫu nạp bằng `python -m app.ws.seed` (mục 4.2.3).
- Mỗi lượt kiểm thử tự động dùng CSDL riêng, tạo mới, không dùng chung với CSDL của người phát triển.

#### 1.4.4. Kế hoạch quản lý lỗi

- **Nơi ghi lỗi:** GitHub Issues của repo, nhãn `bug` và nhãn mức độ.
- **Mẫu báo lỗi:** tiêu đề; mã TC hoặc mã luồng SRS (ví dụ `UC07 A.E1`); môi trường (trình duyệt, commit); các bước tái hiện; kết quả mong đợi; kết quả thực tế; ảnh chụp hoặc tệp trace Playwright; mức độ.
- **Mức độ:**

| Mức | Ý nghĩa | Ví dụ trong SpecGate | Thời hạn xử lý |
| --- | --- | --- | --- |
| Critical | Lộ dữ liệu, mất dữ liệu, sập hệ thống | Lộ API key; đọc được hội thoại của người khác; agent tự đăng tin hoặc tự chốt ý | Trước khi kiểm thử tiếp |
| Major | Một luồng chính không làm được | Không gửi được highlight vào kênh; duyệt yêu cầu không vào được workspace | 2 ngày |
| Minor | Sai ở luồng phụ, có cách khác | Nhãn "trích một phần" hiện sai; dấu báo chưa đọc không tự mất | Trong đợt |
| Trivial | Sai chữ, lệch giao diện | Sai chính tả, lệch khoảng cách | Khi tiện |

- **Vòng đời lỗi:** Mới → Đã xác nhận → Đang sửa → Đã sửa → Đã kiểm lại (đóng) hoặc Mở lại. Mỗi lỗi đã sửa phải có một test tự động mới để không tái phát (mục 3.1.10).
- **Số lỗi dự kiến:** khoảng 40 lỗi trong cả đợt, dựa trên 126 yêu cầu chức năng và mật độ khoảng 0,3 lỗi mỗi yêu cầu cho dự án nhỏ; dùng để theo dõi tiến độ phát hiện lỗi ở mục 6.

### 1.5. Ràng buộc

| Loại | Ràng buộc |
| --- | --- |
| Môi trường | Một máy chủ backend chạy một tiến trình (bộ phát tin thời gian thực nằm trong tiến trình), nên kiểm thử tải chỉ đo trên một bản backend |
| Nguồn lực | Nhóm sinh viên, kiểm thử song song với phát triển; không có tester chuyên trách toàn thời gian |
| Lịch | Hai tuần, kết thúc ngày 02/12/2026, trước buổi nộp 03/12/2026 (mục 5, [SPRINT_PLAN.md](SPRINT_PLAN.md)) |
| Công cụ | Ưu tiên công cụ miễn phí, mã nguồn mở, chạy được trong GitHub Actions |
| Chi phí | Không dùng key AI thật trong kiểm thử tự động |

### 1.6. Danh sách rủi ro

| Mã | Rủi ro | Ảnh hưởng | Cách giảm |
| --- | --- | --- | --- |
| R1 | Agent giả khác hành vi nhà cung cấp thật (định dạng luồng, mã lỗi) | Lỗi chỉ lộ khi dùng key thật | Một lượt kiểm thử thủ công với key thật có hạn mức nhỏ trên staging |
| R2 | Kiểm thử đầu-cuối chập chờn do thời gian thực (SSE) và luồng trả lời dần | Kết quả CI không ổn định | Chờ theo điều kiện (`expect(...).toBeVisible()`), không dùng `sleep`; bật trace khi chạy lại |
| R3 | Giao diện Next.js giữ lại trang cũ ẩn trong DOM | Bộ chọn bắt nhầm phần tử ẩn | Dùng bộ chọn theo vai trò và trạng thái hiển thị (`getByRole`, `:visible`) |
| R4 | Một số quyết định còn mở (ai được chốt ý, giới hạn số lượng; SRS mục 9) | Kết quả mong đợi đổi | Test đọc giới hạn từ cấu hình; ghi rõ phương án đang áp dụng trong TC |
| R5 | SQLite khi kiểm thử khác Postgres khi triển khai | Lỗi chỉ có trên Postgres (ví dụ kiểu boolean khi thêm cột) | Một lượt chạy bộ test API với Postgres (container hoặc Supabase) trước khi phát hành |
| R6 | Thiếu thời gian vì kiểm thử song song với phát triển | Bỏ sót loại kiểm thử ưu tiên thấp | Ưu tiên theo mục 2.4; tự động hóa sớm để chạy lại rẻ |

---

## 2. Yêu cầu kiểm thử

### 2.1. Yêu cầu chức năng

Mỗi dòng là một mục tiêu kiểm thử. Mã TC sẽ theo dạng `TC-UCxx-‹mã luồng›-nn`, ví dụ `TC-UC07-A.E1-01`, để truy ngược về đúng luồng trong SRS và đúng nhánh trên biểu đồ hoạt động.

| Ca sử dụng | Yêu cầu SRS | Nội dung cần kiểm (theo `flow.md`) | Độ phức tạp |
| --- | --- | --- | --- |
| UC01 Đăng nhập, đăng ký, đăng xuất | FR-01 – FR-06, FR-111 – FR-115 | Google/GitHub và mã email; mã 6 số một lần, hết hạn 10 phút, mã mới hủy mã cũ; 60 giây giữa hai lần gửi, 5 mã mỗi giờ, sai 5 lần thì hủy mã; email mới hỏi tên hiển thị; ô email ẩn khi chưa cấu hình SMTP; màn giả lập bắt xác thực email khi tạo mới; lần đầu tạo tài khoản kèm workspace riêng rồi mở màn nhập key; quay về đúng trang định mở; hủy ở nhà cung cấp thì không tạo gì; phiên 30 ngày; đăng xuất | Trung bình |
| UC02 Trang chủ, dấu báo | FR-07 – FR-09 | Trang chủ gọn, không thống kê; nút đổi theo trạng thái (chưa key, chưa nhóm); chấm tin chưa đọc, chấm nhắc @, số yêu cầu chờ, tự cập nhật và tự mất | Trung bình |
| UC03 API key, mô hình | FR-10 – FR-14, FR-116 | Kiểm key ngay; gợi ý địa chỉ (có Gemini); danh sách mô hình bỏ mô hình không chat được; key sai, hết tiền, địa chỉ sai báo câu dễ hiểu và không lưu; chỉ hiện 4 ký tự cuối; đổi mô hình, đổi key, xóa key | Trung bình |
| UC04 Chat với agent | FR-15 – FR-23 | Câu hỏi lưu trước; trả lời hiện dần, có định dạng; Dừng giữ phần đã viết; lỗi nhà cung cấp hiện trong hội thoại và không gửi lại; Tạo lại giữ phiên bản cũ, agent chỉ đọc phiên bản đang hiện; đổi tên, xóa hội thoại hỏi giữ highlight; đoán đường dẫn của người khác chỉ thấy "không tìm thấy" | Phức tạp |
| UC05 Highlight riêng | FR-24 – FR-30 | Bôi đen, chọn màu, ghi chú; giới hạn ~200; lọc, sửa, xóa, dọn dẹp; nhãn "(‹tên› đã chỉnh)" khi sửa chữ agent; không tự đi đâu | Trung bình |
| UC06 Ngữ cảnh nhóm | FR-31 – FR-41 | Khung "Agent đang đọc" đúng nội dung; một dòng thời gian tin của mình và highlight; ~50 tin gần nhất; tóm tắt tin cũ theo khối, một lần gọi, khối ngắn giữ nguyên văn; không còn là thành viên thì không gửi ngữ cảnh; bị nhắc tên không làm tin lọt vào | Phức tạp |
| UC07 Gửi highlight riêng vào kênh | FR-42 – FR-49 | Không có nút gửi thẳng câu trả lời; gửi từ danh sách hoặc bằng @; ba mức trung thực (trọn câu, trích một phần, đã chỉnh); cảnh báo đã gửi, cảnh báo khác nhóm; thẻ là bản chụp | Phức tạp |
| UC08 Tóm tắt hội thoại cho nhóm | FR-50 – FR-53 (mức T) | Khung bốn phần, mỗi ý ghi của ai; lưu vào Highlight riêng, chưa gửi; đính kèm tối đa 4 lượt; thẻ "chưa được lọc" | Trung bình |
| UC09 Tạo workspace chung | FR-54 – FR-56 | Bắt buộc tên và đề bài; không trùng tên mình làm chủ; tối đa ~10; có kênh "chung" và mã | Đơn giản |
| UC10 Xin tham gia | FR-57 – FR-64 | Mã 7 ký tự, chấp nhận chữ thường và dấu cách; mã cũ hết hiệu lực khi đổi; Khám phá chỉ hiện workspace công khai; một yêu cầu chờ mỗi workspace; hủy yêu cầu; trang chờ tự chuyển khi được duyệt | Trung bình |
| UC11 Duyệt yêu cầu | FR-65 – FR-68 | Chỉ chủ thấy trang; duyệt, từ chối, lịch sử; gán màu không trùng; tên trùng thì đặt tên tạm và nhắc biệt danh; người cũ vào lại lấy lại tên | Trung bình |
| UC12 Nhắn tin trong kênh | FR-69 – FR-76 | Tin hiện ngay cho người khác (dưới 2 giây); bốn loại tin phân biệt được; gợi ý @ và /; các lệnh và quyền của từng lệnh; lệnh trong lời agent không chạy; không agent nào tự trả lời | Phức tạp |
| UC13 Highlight cho agent | FR-77 – FR-84 | Nhiều đoạn qua nhiều tin; không highlight được tin của mình; không sửa chữ người khác, chỉ thu hẹp; ghi chú riêng; giới hạn ~30 mỗi workspace; chỉ mình thấy; vào ngữ cảnh kèm người nói | Phức tạp |
| UC14 Bảng ý tưởng | FR-85 – FR-92 | /idea, /note, /pin (hỏi ghim phần nào); chỉ chủ đưa vào bàn; chốt, loại bắt buộc lý do, không quay ngược; agent không chốt được | Trung bình |
| UC15 Tóm tắt kênh, bản tổng hợp | FR-93 – FR-97 | Chỉ chủ; /summarize chỉ đọc đề bài và tin của chính kênh, không tự vào ngữ cảnh của ai; /brief dựng từ bảng, tải Markdown | Trung bình |
| UC16 Thành viên, cài đặt, bảng phân công | FR-98 – FR-106, FR-117 – FR-126 | Tên duy nhất, giữ chỗ mãi, "(đã rời)"; vai ≤ 40 ký tự; rời, xóa thành viên; sửa đề bài, đổi tên, đổi mã, tạo kênh chỉ chủ. Bảng phân công: cây 3 cấp (cấp 4 bị từ chối); thành viên chỉ tự nhận, chủ giao, sửa, xóa (xóa kèm việc con); khóa chặn thêm, sửa, xóa, giao, nhận và `/task` nhưng không chặn đánh dấu xong; người rời được gỡ khỏi việc chưa xong kể cả khi khóa; agent chỉ nhận việc chưa xong kèm việc cha | Phức tạp |
| UC17 Mạng chập chờn | FR-107 – FR-110 | Dải báo mất kết nối; khóa nút gửi; giữ chữ đang soạn; tự nối lại và hiện bù tin | Trung bình |

**Quy tắc nghiệp vụ trọng yếu** (mỗi quy tắc có ít nhất một test riêng, kể cả gọi thẳng API để vượt qua giao diện):

| Quy tắc | Điều phải luôn đúng |
| --- | --- |
| BR-05, NFR-01 | API key không bao giờ xuất hiện trong phản hồi API, log hay tab Network |
| BR-07, NFR-05 | Hội thoại, Highlight riêng, Highlight cho agent của người khác trả 404 |
| BR-11 | Tin của người khác chỉ vào ngữ cảnh agent qua highlight cho agent |
| BR-15 | Không có đường nào đưa lời agent vào kênh ngoài Highlight riêng hoặc bản tóm tắt |
| BR-18 | Cả hai đường vào workspace đều phải chờ chủ duyệt |
| BR-20, BR-23 | Agent không chốt, loại, đưa ý lên bảng; chốt, loại phải có lý do, không quay ngược |
| BR-25 | Tên trong workspace không dùng lại được, kể cả của người đã rời |
| BR-34 | Mã email chỉ lưu dạng băm; quá giới hạn gửi trả 429; sai 5 lần thì mã đúng cũng bị từ chối; câu trả lời khi gửi mã giống nhau dù email đã có tài khoản hay chưa |
| BR-35, BR-38 | Agent không tạo hay đổi việc; bảng đang khóa thì mọi thay đổi phân công trả 409 `TASKS_LOCKED`, trừ người phụ trách đánh dấu xong |

### 2.2. Yêu cầu phi chức năng

| Mã | Loại | Yêu cầu | Cách kiểm |
| --- | --- | --- | --- |
| NFR-01 | Bảo mật | Key mã hóa khi lưu, không lộ ở log, phản hồi, Network | Test API quét mọi phản hồi tìm chuỗi key; đọc CSDL thấy chỉ có bản mã; quét log khi chạy test |
| NFR-02 | Bảo mật | Mọi lời gọi mô hình đi qua máy chủ | Playwright ghi lại mọi request của trình duyệt, khẳng định không có request tới miền của nhà cung cấp AI |
| NFR-03 | Bảo mật | OAuth có `state`; mã email băm, có giới hạn; cookie httpOnly | Test API: callback với `state` sai bị từ chối; đọc CSDL thấy `code_hash` không chứa mã; gửi mã liên tục nhận 429; kiểm cờ cookie |
| NFR-04 | Phân quyền | Mỗi thao tác kiểm quyền ở máy chủ | Ma trận quyền (mục 7.3) chạy tự động bằng pytest với từng vai |
| NFR-05 | Riêng tư | Dữ liệu riêng chỉ chủ đọc được, kể cả qua API | Như BR-07 |
| NFR-06 | Hiệu năng | Tin mới tới người khác dưới 2 giây | Playwright đo thời gian từ lúc gửi tới lúc hiện ở trình duyệt thứ hai; k6 đo khi có tải |
| NFR-07 | Hiệu năng | Câu trả lời hiện ngay khi có chữ đầu tiên | Đo thời gian tới sự kiện SSE đầu tiên |
| NFR-08 | Chi phí | Không gọi mô hình khi người dùng chưa bấm | Đếm lời gọi của agent giả sau các thao tác không phải gửi câu hỏi |
| NFR-09 | Dễ dùng | Lỗi nhà cung cấp thành câu tiếng Việt dễ hiểu | Test API với các key gây lỗi của agent giả |
| NFR-10 | Dễ dùng | Mỗi màn có trạng thái đang tải, rỗng, lỗi | Kiểm thử giao diện thủ công theo checklist |
| NFR-11 | Dễ dùng | Xóa, rời có hộp xác nhận trong ứng dụng | Playwright: không có hộp thoại mặc định của trình duyệt (`page.on('dialog')` không được gọi) |
| NFR-12 | Truy cập | Dùng được bằng bàn phím; tương phản đạt WCAG AA | axe-core trong Playwright; Lighthouse Accessibility ≥ 90; đi luồng chính chỉ bằng phím |
| NFR-13 | Tương thích | Trình duyệt desktop phổ biến; co giãn theo độ rộng | Playwright chạy trên Chromium, Firefox, WebKit; kích thước 1440, 1024, 768, 390 px |
| NFR-14 | Quốc tế hóa | Mọi chữ hiển thị nằm trong tệp ngôn ngữ | `pnpm lint` (luật kiểm mã nguồn không có chữ tiếng Việt trong mã) |
| NFR-15 | Kết nối | Xử lý mất mạng theo UC17 | Playwright `context.setOffline(true/false)` |
| NFR-16 | API | Có `/api/v1`; lỗi dạng `{"error":{"code","message","details"}}` | Schemathesis kiểm mọi đường theo OpenAPI, không có lỗi 500, mọi lỗi đúng dạng |

### 2.3. Những gì không kiểm thử

| Nội dung | Lý do |
| --- | --- |
| Chất lượng câu trả lời của mô hình AI (đúng, hay, an toàn) | Thuộc nhà cung cấp; SpecGate chỉ kiểm việc gửi đúng ngữ cảnh và hiển thị đúng |
| Hạ tầng của Google, GitHub, máy chủ gửi thư, Anthropic, OpenAI | Hệ thống ngoài; chỉ kiểm cách SpecGate xử lý khi chúng lỗi (qua agent giả) |
| Các mục SRS 8.1 "Không làm": quản trị viên, gói thuê bao, tải tệp vào chat, chế độ ngoại tuyến, nhiều key mỗi người | Ngoài phạm vi sản phẩm |
| Trình duyệt di động như ứng dụng chính, Internet Explorer | Ngoài NFR-13; chỉ kiểm bố cục co giãn ở độ rộng 390 px |

### 2.4. Thứ tự ưu tiên

1. Bảo mật và phân quyền (BR-05, BR-07, BR-11, BR-15, BR-18, NFR-01 – NFR-05).
2. Luồng lõi riêng sang chung: UC03, UC04, UC06, UC07, UC12, UC13.
3. Tham gia và quản lý nhóm: UC09 – UC11, UC14, UC15, UC16.
4. Phi chức năng còn lại: hiệu năng, tải, giao diện, truy cập.

---

## 3. Chiến lược kiểm thử

### 3.1. Các loại kiểm thử

Mỗi loại ghi theo bốn ý của mẫu: Mục tiêu, Cách làm, Tiêu chí hoàn thành, Lưu ý đặc biệt.

#### 3.1.1. Function testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Mọi chức năng ở mục 2.1 làm đúng theo luồng chính, luồng thay thế và ngoại lệ của SRS: điều hướng, nhập liệu, xử lý, truy xuất |
| Cách làm | Hộp đen. Thiết kế TC theo từng luồng trên biểu đồ hoạt động: mỗi nhánh `(n)`, `[A…]`, `[E…]` có ít nhất một TC. Dùng phân hoạch tương đương và giá trị biên cho các giới hạn: mã tham gia (6, 7, 8 ký tự; chữ thường; có dấu cách, gạch nối; ký tự O và 0), vai 40 và 41 ký tự, highlight riêng thứ 200 và 201, highlight cho agent thứ 30 và 31, workspace làm chủ thứ 10 và 11, tin của mình thứ 50 và 51, 4 và 5 lượt đính kèm. Dùng bảng quyết định cho lệnh trong kênh (lệnh × vai × có số liệu hay không) và cho ba mức trung thực của đoạn trích. Chạy tự động ở hai tầng: pytest gọi API (kiểm kết quả và dữ liệu lưu), Playwright đi qua giao diện (kiểm điều người dùng thấy) |
| Tiêu chí hoàn thành | 100% TC mức ưu tiên 1, 2 đã chạy; ≥ 95% TC đạt; không còn lỗi Critical, Major đang mở; mọi lỗi đã sửa có test hồi quy |
| Lưu ý đặc biệt | CSDL thử tạo mới mỗi lượt chạy; agent giả bật; dừng kiểm thử chức năng nếu bộ test đơn vị và API (`pytest`, `pnpm test`) chưa xanh |

#### 3.1.2. User interface testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Điều hướng giữa các màn đúng; dùng được bằng chuột, Tab, Enter, Esc, mũi tên (gợi ý @ và /); các thành phần (thanh bên, khung "Agent đang đọc", hộp thoại, thẻ trong kênh) đúng trạng thái và đúng vị trí ở mọi độ rộng |
| Cách làm | Mỗi màn có một TC giao diện: Trang chủ, đăng nhập, màn key, chat, Highlight riêng, kênh, bảng ý tưởng, bản tổng hợp, thành viên, Khám phá, trang chờ duyệt, yêu cầu tham gia. Playwright chụp ảnh và so với ảnh chuẩn (`toHaveScreenshot`) ở 1440, 1024, 768, 390 px; axe-core quét lỗi trợ năng; kiểm thủ công các trạng thái đang tải, rỗng, lỗi; kiểm bốn loại tin trong kênh phân biệt được bằng mắt |
| Tiêu chí hoàn thành | Mọi màn khớp thiết kế đã chốt (hoặc khác biệt được nhóm chấp nhận); không lỗi axe mức serious, critical; Lighthouse Accessibility ≥ 90 ở các màn chính |
| Lưu ý đặc biệt | Ảnh chuẩn chỉ cập nhật khi giao diện đổi có chủ ý; chạy ảnh chụp trên cùng một hệ điều hành (container CI) để tránh khác biệt phông chữ |

#### 3.1.3. Data and database integrity testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Truy cập CSDL đúng, không hỏng dữ liệu; bản chụp không đổi theo nguồn |
| Cách làm | Sau mỗi thao tác trong test API, đọc thẳng các bảng `ws_*` để so: key lưu dạng mã (`secret` không chứa key gốc, `key_last4` đúng); thẻ trích dẫn trong `ws_messages.cards` không đổi khi sửa, xóa Highlight riêng; xóa hội thoại "giữ lại" thì `ws_private_highlights.conversation_deleted = true`; `ws_members.left_at` giữ tên khi rời; `ws_messages.seq` tăng dần không trùng; thứ tự số ý trên bảng không trùng (`board_seq`). Chạy bộ test API trên cả SQLite và Postgres; kiểm `migrate.py` thêm cột cho CSDL cũ không mất dữ liệu; kiểm script chuyển SQLite sang Supabase (đặt lại bộ đếm khóa tự tăng) |
| Tiêu chí hoàn thành | Mọi thao tác đọc ghi đúng thiết kế; không mất, trùng hay hỏng dòng nào; bộ test API xanh trên cả hai CSDL |
| Lưu ý đặc biệt | Postgres chạy bằng container `postgres:16` trong CI hoặc một project Supabase riêng cho kiểm thử, không dùng CSDL thật |

#### 3.1.4. Business cycle testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Toàn bộ chu trình nghiệp vụ chạy đúng từ đầu tới cuối, đúng thứ tự, với dữ liệu hợp lệ và không hợp lệ, mọi quy tắc nghiệp vụ được áp dụng |
| Cách làm | Tự động hóa "Một vòng làm việc mẫu" 10 bước của `flow.md` bằng Playwright với hai trình duyệt độc lập (Lan dùng agent kiểu Anthropic, Long dùng agent kiểu OpenAI): đăng nhập, nhập key, tạo workspace, mời bằng mã, duyệt, highlight cho agent, hỏi agent có ngữ cảnh, highlight riêng, gửi bằng @, tóm tắt cho nhóm, `/idea`, `/pin`, đưa vào bàn, chốt và loại có lý do, `/brief`, tải Markdown. Khẳng định cuối: không bước nào cần copy và dán; agent của Long đọc được đoạn của Lan kèm nhãn "Claude của Lan nói"; ý đã loại có trong ngữ cảnh của cả hai agent. Các chu trình theo thời gian: phiên 30 ngày tính lại khi quay lại; dấu báo tự cập nhật; trang chờ tự chuyển khi được duyệt |
| Tiêu chí hoàn thành | Kịch bản vòng làm việc mẫu chạy xanh 3 lần liên tiếp trên CI và một lần thủ công trước giảng viên |
| Lưu ý đặc biệt | Thời hạn phiên kiểm bằng cách giả lập đồng hồ ở test API (tạo token với hạn đã qua), không chờ thật |

#### 3.1.5. Performance profiling

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Thời gian phản hồi của các giao dịch chính đạt yêu cầu |
| Cách làm | Dùng lại kịch bản chức năng, đo một người dùng: gửi tin tới khi hiện ở trình duyệt khác (NFR-06, mục tiêu dưới 2 giây, p95); gửi câu hỏi tới sự kiện SSE đầu tiên với agent giả (NFR-07, dưới 500 ms); mở kênh có 1.000 tin; dựng ngữ cảnh nhóm với 50 tin và 30 highlight (dưới 300 ms phía máy chủ); Lighthouse Performance cho Trang chủ, kênh, chat (LCP dưới 2,5 giây trên máy thử) |
| Tiêu chí hoàn thành | Giao dịch đơn chạy không lỗi và trong thời gian yêu cầu ở 20 lần đo liên tiếp |
| Lưu ý đặc biệt | Đo trên bản build production (`next build && next start`, uvicorn không `--reload`), không đo trên chế độ dev |

#### 3.1.6. Load testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Hành vi thời gian phản hồi khi tải tăng dần ở các giao dịch: gửi tin, giữ kết nối SSE, hỏi agent, tạo highlight |
| Cách làm | k6 mô phỏng 10, 25, 50 người dùng ảo trong 5 phút mỗi mức: mỗi người giữ một kết nối SSE vào kênh và gửi một tin mỗi 5 giây; 20% người dùng đồng thời hỏi agent giả. Đo p95 thời gian phản hồi, tỉ lệ lỗi, độ trễ tin tới người khác |
| Tiêu chí hoàn thành | Ở 25 người dùng đồng thời (cỡ vài nhóm làm việc cùng lúc): tỉ lệ lỗi dưới 1%, p95 gửi tin dưới 500 ms, tin tới người khác dưới 2 giây |
| Lưu ý đặc biệt | Chạy trên máy riêng hoặc vào giờ riêng, không chạy song song với kiểm thử khác; một tiến trình backend (ràng buộc 1.5) |

#### 3.1.7. Stress testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Tìm ngưỡng làm hệ thống lỗi và kiểm hệ thống hỏng một cách an toàn |
| Cách làm | Dùng lại kịch bản k6, tăng dần tới 200 người dùng ảo; giới hạn RAM container backend (`BACKEND_MEM=512m`); nhiều người cùng thao tác trên cùng dữ liệu: 10 người cùng `/decide` một ý, chủ duyệt cùng một yêu cầu ở hai tab, cùng lúc đặt cùng một biệt danh |
| Tiêu chí hoàn thành | Ghi được số người dùng và mức RAM tối thiểu mà hệ thống bắt đầu lỗi; khi quá tải không mất dữ liệu, không có ý bị chốt hai lần, không có hai thành viên trùng tên |
| Lưu ý đặc biệt | Chạy trên một máy, tách biệt; ghi lại cấu hình máy trong Test Report |

#### 3.1.8. Volume testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Lượng dữ liệu lớn không làm hệ thống lỗi hay chậm quá mức |
| Cách làm | Script nạp dữ liệu (Faker + SQLAlchemy) tạo: một kênh 10.000 tin; một người 200 highlight riêng; 30 highlight cho agent mỗi workspace; hội thoại 500 lượt; 1.000 tin của mình để thử "Tóm tắt tin cũ" với tối đa 31 khối; bảng ý tưởng 500 ý. Kiểm các giới hạn chặn đúng ở biên và màn vẫn dùng được |
| Tiêu chí hoàn thành | Không lỗi; mở kênh và danh sách dưới 2 giây; ngữ cảnh gửi cho agent không vượt giới hạn đã định |
| Lưu ý đặc biệt | Dùng CSDL riêng cho volume test |

#### 3.1.9. Security and access control testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Mức ứng dụng: mỗi vai chỉ làm được đúng quyền của mình. Mức hệ thống: chỉ người đăng nhập mới vào được, và chỉ qua đường hợp lệ |
| Cách làm | **Ma trận quyền tự động:** với mỗi dòng của bảng RBAC (mục 7.3) và mỗi vai (Khách, Người dùng, Người xin, Thành viên, Chủ, người đã rời), pytest gọi đúng đường API và khẳng định mã trả về (2xx, 401, 403, 404). **Riêng tư:** đổi id trong đường dẫn sang tài nguyên của người khác (IDOR) với hội thoại, Highlight riêng, Highlight cho agent, yêu cầu tham gia. **Key:** quét toàn bộ phản hồi và log của bộ test tìm chuỗi key. **Phiên:** cookie sửa chữ ký, hết hạn, sai `state` OAuth. **Agent:** tin có chứa `/decide` do agent viết không được thực thi; không có API nào cho agent tự đăng tin. **Đầu vào:** chèn HTML, script vào tin, tên, đề bài, ghi chú (XSS); địa chỉ API kiểu OpenAI trỏ vào mạng nội bộ bị từ chối (SSRF, `ALLOW_PRIVATE_BASE_URLS=false`). **Quét tự động:** OWASP ZAP baseline vào bản chạy staging; `pip-audit` và `pnpm audit` cho thư viện |
| Tiêu chí hoàn thành | 100% ô của ma trận quyền đạt; không lỗi IDOR, XSS, SSRF; không lộ key; ZAP không còn cảnh báo mức High |
| Lưu ý đặc biệt | Chỉ quét bảo mật môi trường của nhóm (máy mình, staging của nhóm); không quét dịch vụ của bên khác |

#### 3.1.10. Regression testing

| Ý | Nội dung |
| --- | --- |
| Mục tiêu | Thay đổi mới không làm hỏng phần cũ |
| Cách làm | Toàn bộ bộ test tự động là bộ hồi quy: chạy ở mỗi pull request bằng GitHub Actions (đơn vị, API, kiểm mã, build) và chạy Playwright ở mỗi lần gộp vào `dev`, `main`. Mỗi lỗi được sửa phải kèm một test tái hiện lỗi đó. Trước mỗi bản phát hành chạy thêm bộ đầy đủ: Playwright trên ba trình duyệt, bộ test API trên Postgres, Schemathesis |
| Tiêu chí hoàn thành | CI xanh trên commit phát hành; không có test bị tắt mà không có lý do ghi trong issue |
| Lưu ý đặc biệt | Test chập chờn được đánh dấu và mở issue ngay, không bỏ qua im lặng |

### 3.2. Các giai đoạn kiểm thử và tiêu chí vào, ra

| Giai đoạn | Tiêu chí bắt đầu | Tiêu chí kết thúc |
| --- | --- | --- |
| Unit test | Mã của chức năng đã viết | `pnpm test` và test đơn vị pytest xanh; độ phủ dòng ≥ 70% cho `web_ui/src/features/*/utils` và `backend/app/ws` |
| Integration test | Unit test xanh; API có trong OpenAPI | Mọi FR mức M có ít nhất một test API; ma trận quyền đạt; Schemathesis không lỗi 500 |
| System test | Integration xanh; bản build chạy được bằng Docker Compose | Mục 3.1 đạt tiêu chí; không còn lỗi Critical, Major |
| Acceptance test | System test đạt | Vòng làm việc mẫu chạy xanh; giảng viên và nhóm xác nhận |

**Tiêu chí dừng tạm thời:** bộ test đơn vị hoặc API đỏ; môi trường thử không chạy được; có lỗi Critical chặn luồng chính. Tiếp tục khi lỗi được sửa và bản build mới vượt kiểm thử khói (đăng nhập, mở kênh, gửi tin, hỏi agent).

### 3.3. Kiểm thử tự động

Kiểm thử web tự động là trọng tâm của kế hoạch này: mọi loại ở mục 3.1 trừ một phần kiểm thử giao diện đều có phần chạy tự động.

#### 3.3.1. Hiện trạng

| Tầng | Công cụ | Đang có |
| --- | --- | --- |
| Đơn vị giao diện | Vitest, Testing Library, jsdom | 17 tệp test, ví dụ `features/auth/components/LoginForm.test.tsx`, `features/tasks/utils/task-tree.test.ts`, ví dụ `features/channel/utils/commands.test.ts`, `features/board/components/BoardItemCard.test.tsx` |
| API máy chủ | pytest, httpx (TestClient của FastAPI) | 103 test: `test_ws.py` (48), `test_ws_email_sign_in.py` (16), `test_ws_tasks.py` (14), `test_ws_flow_rules.py` (12), `test_ws_flow.py` (7), `test_ws_workspace_rename.py` (4), `test_ws_providers.py` (2) |
| Kiểm mã | ESLint, luật kiểm mã nguồn riêng, TypeScript, Prettier | Chạy chung bằng `pnpm check` |
| CI | GitHub Actions | `backend.yml` chạy `pytest -q`; `web.yml` chạy `pnpm check` và build |
| Đầu-cuối | Playwright | Đã cài (`@playwright/test` 1.65) nhưng chưa có cấu hình và kịch bản kiểm thử |

#### 3.3.2. Công nghệ đề xuất

| Mục đích | Đề xuất chính | Lựa chọn khác | Lý do chọn |
| --- | --- | --- | --- |
| Kiểm thử web đầu-cuối (system, acceptance, regression) | **Playwright Test** (TypeScript) | Selenium WebDriver + pytest; Cypress; Katalon Studio | Đã có trong dự án; chạy Chromium, Firefox, WebKit; mỗi `browser.newContext()` là một người dùng riêng nên kiểm được Lan và Long cùng lúc trong một test (Cypress chỉ một tab); tự chờ phần tử nên hợp với luồng SSE; có trace viewer, quay video, báo cáo HTML; chạy trong GitHub Actions. Nếu giảng viên yêu cầu Selenium, viết lại kịch bản bằng Selenium + pytest với cùng TC |
| Kiểm thử API | **pytest + httpx** (đang có) | Postman + Newman | Gần mã máy chủ, đọc được CSDL để kiểm toàn vẹn dữ liệu. Có thể xuất một bộ Postman cho phần trình bày và chạy bằng Newman trong CI |
| Kiểm thử theo hợp đồng API | **Schemathesis** | Dredd | Sinh hàng nghìn yêu cầu từ OpenAPI của FastAPI, tìm lỗi 500 và phản hồi sai dạng NFR-16 |
| Kiểm thử theo thuộc tính | **Hypothesis** (Python), **fast-check** (TypeScript) | | Tự sinh đầu vào cho hàm chuẩn hóa mã, so khớp đoạn highlight với tin gốc, tách lệnh `/decide` |
| Đơn vị giao diện | **Vitest + Testing Library** (đang có) | Jest | Nhanh, hợp với Vite và React 19 |
| Hiệu năng, tải, quá tải | **k6** | Locust, Apache JMeter | Viết kịch bản bằng JavaScript, hỗ trợ HTTP và đọc SSE, chạy trong CI, xuất số p95 |
| Đo hiệu năng trang | **Lighthouse CI** | WebPageTest | Đo LCP, Accessibility, Best Practices cho từng trang |
| Trợ năng | **@axe-core/playwright** | Pa11y | Chạy ngay trong kịch bản Playwright |
| Ảnh chụp so sánh giao diện | **Playwright `toHaveScreenshot`** | Percy, Chromatic | Miễn phí, không cần dịch vụ ngoài |
| Bảo mật | **OWASP ZAP** (baseline scan), **pip-audit**, **pnpm audit** | Burp Suite Community | Quét tự động lỗi web phổ biến và thư viện có lỗ hổng |
| Sinh dữ liệu thử | **Faker** + script nạp dữ liệu; `python -m app.ws.seed` | Mockaroo | Tạo dữ liệu cho volume test và dữ liệu mẫu ba người Lan, Long, Trang |
| Độ phủ mã | **pytest-cov**, **@vitest/coverage-v8** | Codecov | Số liệu độ phủ cho Test Report |
| Báo cáo kết quả | **Playwright HTML report**, **Allure Report** | | Báo cáo trực quan cho giảng viên: từng TC, ảnh, video khi lỗi |
| Quản lý TC và lỗi | **GitHub Issues + GitHub Projects**; TC trong bảng tính | Jira, Qase, TestRail | Gần mã nguồn; liên kết lỗi với pull request sửa lỗi |
| Chạy tự động | **GitHub Actions** (đang có) | | Chạy mọi bộ test khi mở pull request và khi gộp |

#### 3.3.3. Cách tổ chức bộ test tự động

```
web_ui/
  playwright.config.ts          # baseURL, ba trình duyệt, trace khi chạy lại, webServer
  e2e/
    fixtures/                   # tạo phiên đăng nhập cho Lan, Long, Trang; nạp dữ liệu
    uc01-sign-in.spec.ts        # một tệp mỗi ca sử dụng, tên TC theo mã luồng SRS
    uc10-join.spec.ts
    business-cycle.spec.ts      # vòng làm việc mẫu 10 bước
    accessibility.spec.ts
    visual.spec.ts
backend/tests/
  test_ws*.py                   # đang có
  test_ws_permissions.py        # ma trận quyền (cần thêm)
  test_ws_properties.py         # Hypothesis (cần thêm)
tests-load/
  channel.k6.js                 # kịch bản k6
```

Thêm lệnh chuẩn theo `AGENTS.md`: `"test:e2e": "playwright test"` trong `web_ui/package.json`.

**Cấu hình Playwright** (chạy máy chủ ở chế độ giả lập, CSDL riêng):

```ts
// Configures Playwright end-to-end tests against a production build with fake LLM and dev login.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: "http://localhost:3010", trace: "on-first-retry", video: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "uvicorn app.main:app --port 8010",
      cwd: "../backend",
      url: "http://localhost:8010/api/v1/health",
      env: { DATABASE_URL: "sqlite:///./e2e.db", LLM_FAKE: "true", AUTH_DEV_LOGIN: "true" },
    },
    { command: "pnpm start -p 3010", url: "http://localhost:3010", env: { BACKEND_URL: "http://localhost:8010" } },
  ],
});
```

**Kịch bản mẫu: UC10 và UC11 với hai người dùng cùng lúc**

```ts
// Verifies that a join request by code waits for the owner and redirects the requester after approval.
import { expect, test, type Browser } from "@playwright/test";

async function signIn(browser: Browser, login: string, displayName: string) {
  const context = await browser.newContext();
  await context.request.post("/api/v1/auth/dev-sessions", {
    data: { provider: "github", login, displayName },
  });
  return context.newPage();
}

test("TC-UC10-A-01 should move the requester into the workspace when the owner approves", async ({ browser }) => {
  const lan = await signIn(browser, "lan-e2e", "Lan");
  const trang = await signIn(browser, "trang-e2e", "Trang");

  await lan.goto("/");
  await lan.getByRole("button", { name: "Tạo mới" }).click();
  await lan.getByLabel("Tên").fill("Đồ án Kiểm chứng E2E");
  await lan.getByLabel("Đề bài").fill("Kiểm chứng đặc tả bằng agent");
  await lan.getByRole("button", { name: "Tạo workspace" }).click();
  const code = await lan.getByTestId("join-code").innerText();

  await trang.goto("/");
  await trang.getByRole("button", { name: "Nhập mã" }).click();
  await trang.getByRole("textbox").fill(code.toLowerCase());
  await trang.getByRole("button", { name: "Tham gia" }).click();
  await expect(trang.getByRole("heading", { name: "Đang chờ duyệt" })).toBeVisible();

  await lan.goto(lan.url().replace(/\/channels\/.*/, "/requests"));
  await lan.getByRole("button", { name: "Duyệt" }).click();

  await expect(trang).toHaveURL(/\/channels\//);
});
```

Nhãn của ô nhập và `data-testid="join-code"` cần khớp với giao diện thật; thêm `data-testid` vào thành phần nếu chưa có.

**Kịch bản k6 mẫu: gửi tin trong kênh**

```js
// Load test: virtual members post channel messages and measure latency.
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [{ duration: "1m", target: 25 }, { duration: "3m", target: 25 }, { duration: "1m", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"] },
};

const BASE = __ENV.BASE_URL;

export default function () {
  const res = http.post(`${BASE}/api/v1/workspaces/${__ENV.WS}/channels/${__ENV.CH}/messages`,
    JSON.stringify({ text: `tin thử ${__VU}-${__ITER}` }),
    { headers: { "Content-Type": "application/json", Cookie: `sg_session=${__ENV.SESSION}` } });
  check(res, { "đã gửi": (r) => r.status === 201 });
  sleep(5);
}
```

**Lệnh chạy**

```bash
cd backend && pytest -q -m "not slow" --cov=app/ws
```

```bash
cd web_ui && pnpm check
```

```bash
cd web_ui && pnpm exec playwright test
```

```bash
schemathesis run http://localhost:8010/openapi.json --checks all
```

```bash
k6 run -e BASE_URL=http://localhost:8010 -e WS=… -e CH=… -e SESSION=… tests-load/channel.k6.js
```

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://staging.example.com
```

#### 3.3.4. Lịch chạy tự động

| Khi nào | Chạy gì |
| --- | --- |
| Mỗi pull request | `pnpm check`, `pnpm build`, pytest (không chậm), Playwright trên Chromium, Schemathesis |
| Mỗi lần gộp vào `dev` | Thêm Playwright trên Firefox, WebKit; ảnh chụp so sánh; axe |
| Trước phát hành (`main`) | Thêm pytest trên Postgres; vòng làm việc mẫu 3 lần; Lighthouse CI; ZAP baseline trên staging |
| Hằng tuần trong đợt | k6 tải và quá tải; volume test |

### 3.4. Công cụ kiểm thử

Theo nhóm công cụ của mẫu:

| Nhóm | Công cụ dùng trong dự án |
| --- | --- |
| Ghi nhận lỗi | GitHub Issues, GitHub Projects (bảng theo dõi trạng thái lỗi) |
| Kiểm thử tải | k6 (Locust hoặc JMeter nếu giảng viên yêu cầu) |
| Kiểm thử hiệu năng | k6, Lighthouse CI, Playwright đo thời gian giữa hai trình duyệt |
| Sinh dữ liệu tự động | Faker, `python -m app.ws.seed`, Hypothesis, Schemathesis |
| Kiểm thử đồ họa, giao diện | Playwright `toHaveScreenshot`, @axe-core/playwright, DevTools của trình duyệt (thay Eye Dropper, VRuler để đo màu và khoảng cách) |
| Kiểm thử đơn vị | Vitest, Testing Library, pytest |
| Kiểm thử chức năng | Playwright Test (Selenium WebDriver là phương án thay thế) |
| Bảo mật | OWASP ZAP, pip-audit, pnpm audit |
| Báo cáo | Playwright HTML report, Allure, pytest-cov, coverage của Vitest |

---

## 4. Nguồn lực

### 4.1. Nhân lực

Nhóm điền tên người đảm nhận vào cột cuối.

| Vai trò | Trách nhiệm | Người đảm nhận |
| --- | --- | --- |
| Test Leader | Viết và cập nhật Test Plan; phân công; theo dõi tiến độ, số lỗi; duyệt Test Report; điều phối với giảng viên | |
| Tester tự động (đầu-cuối) | Cấu hình Playwright; viết kịch bản đầu-cuối, vòng làm việc mẫu, ảnh chụp, axe; đưa vào CI | |
| Tester API và bảo mật | Ma trận quyền, Schemathesis, Hypothesis, kiểm thử bảo mật, ZAP | |
| Tester phi chức năng | k6 (tải, quá tải), volume test, Lighthouse | |
| Tester thủ công, giao diện | Viết TC theo mẫu; kiểm giao diện, trạng thái đang tải, rỗng, lỗi; kiểm bằng bàn phím; kiểm OAuth thật và key thật trên staging | |
| Lập trình viên | Unit test cho mã mình viết; sửa lỗi; thêm test hồi quy cho mỗi lỗi; thêm `data-testid` khi tester cần | Cả nhóm |
| Quản lý hạ tầng | Môi trường staging (Docker Compose, Supabase), biến môi trường, GitHub Actions | |

### 4.2. Hệ thống

#### 4.2.1. Máy chủ

| Môi trường | Cấu hình |
| --- | --- |
| Kiểm thử tự động (CI) | GitHub Actions `ubuntu-latest`; Python 3.13; Node theo `.nvmrc`; pnpm; backend uvicorn với `LLM_FAKE=true`, `AUTH_DEV_LOGIN=true`; web `next build && next start` |
| Staging | VPS Ubuntu 24.04, 2 vCPU, 4 GB RAM, Docker Compose với `compose.prod.yaml` (Caddy HTTPS); OAuth Google, GitHub thật; agent thật bằng key có hạn mức nhỏ của nhóm |
| Máy tải | Một máy riêng chạy k6, cùng mạng với staging |

#### 4.2.2. Máy khách

| Hạng mục | Yêu cầu |
| --- | --- |
| Hệ điều hành | macOS 14+, Windows 11, Ubuntu 22.04+ |
| Trình duyệt | Chrome, Edge, Firefox, Safari bản mới (Playwright dùng Chromium, Firefox, WebKit) |
| Độ rộng màn hình | 1440, 1024, 768, 390 px |
| Khác | Có thể ngắt mạng để kiểm UC17 (Playwright `setOffline`, hoặc DevTools "Offline") |

#### 4.2.3. Máy chủ CSDL và dữ liệu thử

| Hạng mục | Cấu hình |
| --- | --- |
| CSDL kiểm thử tự động | SQLite tạo mới mỗi lượt chạy (`backend/tests/conftest.py`; `e2e.db` cho Playwright) |
| CSDL kiểm tương thích | Postgres 16 trong container CI, hoặc một project Supabase riêng cho kiểm thử |
| Dữ liệu mẫu | `python -m app.ws.seed` (thêm `--reset` để làm lại): **Lan** (GitHub `lan-pham`) chủ "Đồ án Kiểm chứng", mã `KC26DAX`, vai "Dựng khung", dùng Claude; **Long** (GitHub `long-tran`) thành viên, vai "Runner", agent kiểu OpenAI; **Trang** (Google `trang@example.edu`) có key, chưa vào nhóm nào |
| Key thử | Chuỗi bất kỳ dài ít nhất 20 ký tự với agent giả; kết thúc bằng `0000` để giả hết hạn mức; không bao giờ dùng key thật trong test tự động |

---

## 5. Mốc kiểm thử

### 5.1. Ước lượng

Ước lượng theo cách chia công việc (mẫu, trang "Test Estimation - Reality"): xếp các yêu cầu ở mục 2.1 vào ba mức phức tạp, rồi cộng công cho từng việc.

| Mức | Ca sử dụng | Số ca | Công mỗi ca (người-ngày): đọc yêu cầu + viết TC + dữ liệu + tự động hóa + chạy | Tổng |
| --- | --- | --- | --- | --- |
| Đơn giản | UC09 | 1 | 0,25 + 0,25 + 0,25 + 0,5 + 0,25 = 1,5 | 1,5 |
| Trung bình | UC01, UC02, UC03, UC05, UC08, UC10, UC11, UC14, UC15, UC16, UC17 | 11 | 0,25 + 0,5 + 0,25 + 1 + 0,5 = 2,5 | 27,5 |
| Phức tạp | UC04, UC06, UC07, UC12, UC13 | 5 | 0,5 + 1 + 0,5 + 1,5 + 0,5 = 4 | 20 |
| Phi chức năng | Hiệu năng, tải, quá tải, volume, bảo mật, giao diện | | | 8 |
| Quản lý | Test Plan, họp, Test Report | | | 4 |
| **Tổng** | | | | **61 người-ngày** |

Với nhóm 5 người dồn toàn bộ thời gian cho hoàn thiện và kiểm thử, cần khoảng 12 ngày, nằm trong kế hoạch 2 tuần ở [SPRINT_PLAN.md](SPRINT_PLAN.md).

### 5.2. Mốc

Ngày là đề xuất, nhóm chỉnh theo lịch nộp đồ án.

| Mốc | Công việc | Công (người-ngày) | Bắt đầu | Kết thúc |
| --- | --- | --- | --- | --- |
| Test planning | Phân tích yêu cầu từ `flow.md` và SRS; viết và duyệt Test Plan; dựng khung Playwright, đo độ phủ ban đầu | 6 | 18/11/2026 | 20/11/2026 |
| Test design và tự động hóa | Viết kịch bản Playwright, unit test, ma trận quyền, dữ liệu thử; chạy Schemathesis | 30 | 21/11/2026 | 25/11/2026 |
| Test execution | Chạy trên bản triển khai; kiểm thử thủ công với key thật; k6, Lighthouse, ZAP; ghi lỗi, kiểm lại lỗi đã sửa | 26 | 26/11/2026 | 29/11/2026 |
| Test evaluation | Tổng hợp số liệu, độ phủ, lỗi; viết Test Cases và Test Report; tổng duyệt nghiệm thu | 8 | 30/11/2026 | 02/12/2026 |

---

## 6. Sản phẩm bàn giao

| Sản phẩm | Nội dung | Ngày bàn giao | Người lập | Người nhận |
| --- | --- | --- | --- | --- |
| Test Plan | Tài liệu này | 20/11/2026 | Test Leader | Nhóm, giảng viên |
| Test Cases | Bảng TC (mã `TC-UCxx-‹mã luồng›-nn`, tiền điều kiện, các bước, dữ liệu, kết quả mong đợi, mức ưu tiên, tự động hay thủ công); mã nguồn kịch bản tự động trong `web_ui/e2e/`, `backend/tests/`, `tests-load/` | 30/11/2026 | Tester | Test Leader |
| Test Data | Script nạp dữ liệu, tệp lỗi cho ngoại lệ | 25/11/2026 | Tester | Test Leader |
| Báo cáo lỗi | Danh sách GitHub Issues nhãn `bug`, theo mức độ và trạng thái | Liên tục trong đợt | Tester | Test Leader, lập trình viên |
| Test Report | Số TC đã chạy, đạt, lỗi theo ca sử dụng; độ phủ yêu cầu (mục 7.2); độ phủ mã; số lỗi theo mức độ và trạng thái; kết quả hiệu năng, tải; báo cáo Playwright HTML hoặc Allure; kết luận đạt hay chưa đạt | 30/11/2026 | Test Leader | Giảng viên |

**Chỉ số theo dõi** (mẫu yêu cầu "quản lý bằng số liệu"): tỉ lệ TC đã chạy và đạt; số lỗi mở theo mức độ mỗi tuần; số lỗi phát hiện so với dự kiến (40); độ phủ yêu cầu (FR có ít nhất một TC đạt); độ phủ mã; tỉ lệ test chập chờn trên CI.

---

## 7. Phụ lục

### 7.1. Mẫu Test Case

| Trường | Ví dụ |
| --- | --- |
| Mã | TC-UC07-A.A2-01 |
| Tên | Cảnh báo khi gửi highlight viết lúc đọc ngữ cảnh nhóm khác |
| Yêu cầu | UC07 A.A2, FR-46, BR-15 |
| Tiền điều kiện | Lan là thành viên "Nhóm A" và "Nhóm B"; có một highlight riêng của câu trả lời viết khi hội thoại đọc ngữ cảnh "Nhóm A" |
| Các bước | 1. Mở Highlight riêng. 2. Chọn highlight, bấm "Gửi vào nhóm". 3. Chọn "Nhóm B", kênh "chung". 4. Bấm Gửi |
| Dữ liệu | Highlight "Nên chạy thêm 40 tác vụ…" |
| Kết quả mong đợi | Hộp thoại hiện cảnh báo "Đoạn này được viết khi agent đang đọc thông tin của nhóm Nhóm A…"; chưa gửi tới khi xác nhận; xác nhận xong tin hiện trong kênh của Nhóm B |
| Mức ưu tiên | 2 |
| Cách chạy | Tự động (Playwright) |

### 7.2. Truy vết yêu cầu và loại kiểm thử

| Ca sử dụng | Function | UI | Data | Business cycle | Performance, load | Security | Công cụ chính |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| UC01 | ✔ | ✔ | ✔ | ✔ | | ✔ | Playwright, pytest |
| UC02 | ✔ | ✔ | | ✔ | | | Playwright |
| UC03 | ✔ | ✔ | ✔ | ✔ | | ✔ | pytest, Playwright |
| UC04 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | pytest, Playwright, k6 |
| UC05 | ✔ | ✔ | ✔ | ✔ | | ✔ | pytest, Playwright |
| UC06 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | pytest, Hypothesis |
| UC07 | ✔ | ✔ | ✔ | ✔ | | ✔ | Playwright, pytest |
| UC08 | ✔ | ✔ | ✔ | ✔ | | | pytest, Playwright |
| UC09 | ✔ | ✔ | ✔ | ✔ | | ✔ | pytest, Playwright |
| UC10 | ✔ | ✔ | ✔ | ✔ | | ✔ | Playwright, Hypothesis |
| UC11 | ✔ | ✔ | ✔ | ✔ | | ✔ | Playwright, pytest |
| UC12 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Playwright, k6 |
| UC13 | ✔ | ✔ | ✔ | ✔ | | ✔ | Playwright, pytest |
| UC14 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | pytest, Playwright |
| UC15 | ✔ | ✔ | ✔ | ✔ | | ✔ | pytest, Playwright |
| UC16 | ✔ | ✔ | ✔ | ✔ | | ✔ | pytest, Playwright |
| UC17 | ✔ | ✔ | | | ✔ | | Playwright |

### 7.3. Ma trận quyền cần kiểm tự động

Lấy từ bảng RBAC ([uml/README.md](../uml/README.md#bảng-rbac)). Mỗi ô là một test: vai × thao tác → mã trả về mong đợi.

| Thao tác (API) | Khách | Người dùng | Người xin | Thành viên | Chủ | Người đã rời |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Đọc hội thoại của người khác `GET /conversations/{id}` | 401 | 404 | 404 | 404 | 404 | 404 |
| Gửi tin `POST …/channels/{ch}/messages` | 401 | 403 | 403 | 201 | 201 | 403 |
| Highlight cho agent trên tin của mình | 401 | 403 | 403 | 4xx | 4xx | 403 |
| Đưa ý vào bàn `PUT …/board/{n}/status` | 401 | 403 | 403 | 403 | 200 | 403 |
| Chốt, loại `PUT …/board/{n}/decision` | 401 | 403 | 403 | 200 | 200 | 403 |
| `/summarize`, `/brief` | 401 | 403 | 403 | tin từ chối | 2xx | 403 |
| Xem, duyệt yêu cầu `GET …/join-requests` | 401 | 403 | 403 | 403 | 200 | 403 |
| Đổi mã `PUT …/join-code` | 401 | 403 | 403 | 403 | 200 | 403 |
| Rời workspace `DELETE …/members/me` | 401 | 403 | 403 | 204 | 409 | 403 |
| Thêm việc đứng tên mình `POST …/tasks` | 401 | 403 | 403 | 201 | 201 | 403 |
| Giao việc cho người khác `POST …/tasks {assigneeId}` | 401 | 403 | 403 | 403 | 201 | 403 |
| Sửa, xóa việc `PATCH`, `DELETE …/tasks/{n}` | 401 | 403 | 403 | 403 | 200 / 204 | 403 |
| Khóa bảng phân công `PUT …/tasks/lock` | 401 | 403 | 403 | 403 | 200 | 403 |
| Thêm việc khi bảng khóa | 401 | 403 | 403 | 409 | 409 | 403 |

### 7.4. Checklist rà soát Test Plan

Theo phần "TP Review Checklist" của bài giảng.

| Mục kiểm | Có trong tài liệu |
| --- | --- |
| Đúng mẫu: Giới thiệu, Yêu cầu kiểm thử, Chiến lược, Nguồn lực, Mốc, Sản phẩm bàn giao | Mục 1 – 6 |
| Mục đích, thông tin dự án, tài liệu tham khảo | 1.1 – 1.3 |
| Giai đoạn, loại kiểm thử, giả định, kế hoạch lỗi | 1.4 |
| Ràng buộc và rủi ro | 1.5, 1.6 |
| Yêu cầu chức năng, phi chức năng, phần không kiểm | 2.1 – 2.3 |
| Mỗi loại kiểm thử có mục tiêu, cách làm, tiêu chí hoàn thành, lưu ý | 3.1 |
| Tiêu chí bắt đầu, kết thúc, dừng | 3.2 |
| Quyết định tự động hóa sớm, công cụ | 3.3, 3.4 |
| Nhân lực và hệ thống (máy chủ, máy khách, CSDL) | 4 |
| Ước lượng, mốc có công, ngày bắt đầu, kết thúc | 5 |
| Sản phẩm bàn giao có ngày, người lập, người nhận; chỉ số theo dõi | 6 |
