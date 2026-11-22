# Các vấn đề cần xử lý (22/11)

Ghi lại ba vấn đề trước khi code: chi phí token khi gửi ngữ cảnh, thông báo cồng kềnh, và import PDF/Word cùng xuất Markdown. Mỗi vấn đề gồm hiện trạng, phân tích, đề xuất và các điểm cần chốt.

---

## 1. Chi phí token: ngữ cảnh nhóm bị gửi lại ở mọi lượt hỏi

### 1.1 Hiện trạng

Luồng trong `backend/app/ws/routers/conversations.py`, hàm `_answer`:

1. Lưu câu hỏi vào DB.
2. `context.build()` đọc lại từ DB: đề bài, thành viên, bảng việc, ý đã chốt và đã loại, tối đa `CONTEXT_OWN_MESSAGES_MAX` (50) tin của chính người dùng, tối đa `AGENT_HIGHLIGHTS_MAX` (30) highlight, bản tóm tắt tin cũ.
3. `context.render_system()` ghép thành system prompt.
4. `_history()` lấy tối đa `CONVERSATION_HISTORY_TURNS_MAX` (40) lượt gần nhất.
5. `providers.stream_chat()` gửi tất cả lên nhà cung cấp.

Ví dụ: hỏi "phân tích học sinh UIT", sau đó hỏi "m học trường nào?". Câu thứ hai rất ngắn nhưng vẫn kèm toàn bộ system prompt và lịch sử, nên chi phí token gần bằng câu đầu.

### 1.2 Phân tích

- Đọc DB không tốn token. Chi phí nằm ở việc gửi lại system prompt dài ở mọi lần gọi.
- API của LLM không giữ trạng thái giữa các lần gọi. Mô hình không "quen" ngữ cảnh: lần gọi nào cũng phải gửi đủ những gì mô hình cần biết.
- Chỉ gửi ngữ cảnh ở lượt đầu rồi để nó nằm trong lịch sử không tiết kiệm được gì, vì lịch sử cũng được gửi lại ở mọi lượt.
- Hiện chưa đo số token thực tế của mỗi lượt, nên chưa biết chính xác tốn bao nhiêu.

### 1.3 Đề xuất

**A. Prompt caching (làm trước)**

- Anthropic: gắn `cache_control` vào system prompt và cuối lịch sử. Phần đọc từ cache tính khoảng 10% giá gốc, cache sống 5 phút và được gia hạn mỗi lần dùng.
- Kiểu OpenAI (OpenAI, DeepSeek, Gemini...): nhà cung cấp tự cache phần đầu giống nhau khi prompt từ khoảng 1024 token. Mức giảm tùy nhà cung cấp.
- Sắp lại system prompt để phần đầu ổn định:
  - Khối 1, ít đổi: chỉ dẫn cơ bản, đề bài, thành viên, bảng việc, ý đã chốt và đã loại.
  - Khối 2, hay đổi: dòng thời gian tin và highlight. Dòng "N tin cũ không được gửi kèm" chuyển xuống khối này.
- Đọc số token (input, cache đọc, cache ghi) từ phản hồi của nhà cung cấp và lưu vào lượt trả lời, để đo được mức tiết kiệm.
- Hành vi không đổi. Panel "Agent đang đọc" (FR-27) vẫn đúng với những gì gửi đi.

**B. Agent tự lấy ngữ cảnh khi cần (tool calling), chỉ làm nếu A chưa đủ**

- System prompt chỉ còn phần ngắn, kèm một tool kiểu `get_workspace_context`. Câu hỏi không cần ngữ cảnh nhóm thì không tốn token ngữ cảnh.
- Rủi ro:
  - Mô hình có thể không gọi tool khi lẽ ra phải gọi, nên trả lời thiếu ngữ cảnh.
  - Khi cần ngữ cảnh thì tốn thêm một vòng gọi, nên chậm hơn.
  - Các nhà cung cấp kiểu OpenAI hỗ trợ tool không đều.
  - Phải viết lại FR-27.
- Nếu làm, để thành tùy chọn bật hoặc tắt theo hội thoại.

**Không đề xuất:** dùng một model rẻ để phân loại câu hỏi trước khi gọi. Cách này thêm một lần gọi và dễ phân loại sai.

### 1.4 Cần chốt

- Chỉ làm A, hay làm cả A và B?

---

## 2. Thông báo cồng kềnh

### 2.1 Hiện trạng

- `web_ui/src/locales/vi.json` có 682 chuỗi, trong đó 15 chuỗi dài hơn 120 ký tự. Chuỗi dài nhất là `personal.agentHighlightsIntro`, 319 ký tự.
- Nhiều thông báo vừa nói trạng thái vừa giải thích cách hệ thống hoạt động, và lặp lại cùng một ý ở nhiều nơi ("agent của bạn, chạy bằng key của bạn", "chưa phải quyết định của nhóm").
- Khoảng 100 chỗ `ApiError(...)` ở backend viết cứng thông báo tiếng Việt. Frontend hiện nguyên văn message đó (`web_ui/src/lib/api/http-client.ts`), nên giao diện tiếng Anh vẫn hiện lỗi tiếng Việt. Cách này trái với AGENTS.md mục 2: thông báo cho người dùng phải nằm trong `locales/`.
- Thông báo lỗi của nhà cung cấp mô hình (`MESSAGES` trong `backend/app/ws/providers.py`) cũng viết cứng ở backend.

### 2.2 Quy tắc viết thông báo

- Tối đa hai câu: một câu nói chuyện gì xảy ra, một câu nói người dùng làm gì tiếp. Mục tiêu dưới khoảng 100 ký tự.
- Phần giải thích chuyển sang tooltip hoặc trang hướng dẫn, không đặt trong thông báo.
- Hộp xác nhận: tiêu đề là câu hỏi có động từ, nội dung nói hậu quả, nút là động từ ("Xóa", "Hủy").
- Không dùng câu đệm, không dùng "Bạn có thể...", không dùng dấu chấm than, không dùng emoji.
- Một khái niệm dùng một từ ở mọi nơi.

### 2.3 Ví dụ

| Khóa | Hiện tại | Đề xuất |
|---|---|---|
| `personal.agentHighlightsIntro` | Những đoạn bạn bôi đen trong tin của người khác ở kênh chung, để agent của bạn đọc... (319 ký tự) | Đoạn bạn chọn từ tin của người khác. Agent của bạn đọc được, nhóm không thấy. Tối đa {limit} đoạn. |
| `personal.streamInterrupted` | Mất kết nối giữa chừng. Phần đã nhận được vẫn lưu trong hội thoại; bấm Tạo lại nếu muốn câu trả lời đầy đủ. | Mất kết nối. Phần đã nhận vẫn được lưu. |
| `personal.digestPlan` | Bấm thì agent của bạn, chạy bằng key của bạn, tóm tắt {messages} tin này thành {blocks} khối... | Tóm tắt {messages} tin cũ thành {blocks} khối, dùng key của bạn. |

### 2.4 Đề xuất

- Bước 1: rút gọn các chuỗi trong `vi.json` và `en.json` theo quy tắc ở mục 2.2.
- Bước 2, thay đổi riêng: frontend dịch lỗi theo `code` (`NO_KEY`, `EMAIL_CODE_INVALID`...), còn backend trả message tiếng Anh. Lỗi của nhà cung cấp mô hình cũng xử lý theo cách này.

### 2.5 Cần chốt

- Chỉ làm bước 1, hay làm cả bước 2?

---

## 3. Import PDF/Word và xuất Markdown

### 3.1 Hiện trạng

- Chưa có endpoint nhận file và chưa có ô chọn file ở frontend. `Ask` chỉ nhận `text`, tối đa 20000 ký tự.
- `AttachTurnsDialog` dùng để đính kèm các lượt chat, không phải file.
- Agent được dặn trả lời bằng Markdown khi cần. Giao diện luôn render Markdown (`react-markdown`, `remark-gfm`). Nút Copy chép nội dung Markdown thô. Người dùng không chọn được định dạng.
- Chỗ duy nhất tải được file `.md` là bản tổng hợp (`GET /workspaces/{id}/brief.md`).

### 3.2 Đề xuất: import

- Nút đính kèm ở ô chat, nhận `.pdf` và `.docx`, giới hạn khoảng 10 MB. Không nhận `.doc` đời cũ.
- Server chuyển file sang Markdown và chỉ lưu phần chữ vào bảng mới `conversation_documents`: `id`, `conversation_id`, `owner_id`, `file_name`, `mime_type`, `size_bytes`, `markdown`, `char_count`, `created_at`. File gốc không lưu.
- Thư viện:
  - `pypdf` cho PDF, `mammoth` và `markdownify` cho Word. Cả ba nhẹ, giấy phép BSD hoặc MIT.
  - Không chọn `markitdown`: kéo theo nhiều phụ thuộc nặng cho Docker image.
  - Không chọn `pymupdf4llm`: giấy phép AGPL.
- PDF dạng ảnh scan không có chữ: báo lỗi, không làm OCR.
- Liên quan tới vấn đề 1:
  - Tài liệu ít thay đổi, nên đặt vào phần prompt được cache.
  - Tài liệu vượt giới hạn ký tự thì cắt bớt và báo cho người dùng.
  - Panel "Agent đang đọc" hiện cả tài liệu đang được gửi.
- Phạm vi trước mắt: gắn tài liệu vào hội thoại riêng. Gắn vào workspace chung, để agent của cả nhóm cùng đọc, cần thêm quy tắc nghiệp vụ (ai được tải lên, ai được xóa).

### 3.3 Đề xuất: định dạng trả về và xuất file

- Agent vẫn viết Markdown, vì giao diện render Markdown tốt nhất.
- Phần "chọn định dạng" nằm ở lúc lấy kết quả ra. Mỗi câu trả lời có ba lựa chọn: "Sao chép Markdown", "Sao chép văn bản thường", "Tải .md".
- Thêm "Tải cả hội thoại .md", làm theo cách của `brief.md`.
- Xuất `.docx` hoặc PDF để làm sau nếu cần, vì phải thêm thư viện.

### 3.4 Cần chốt

- Gắn tài liệu theo hội thoại riêng hay theo workspace chung?
- Cách chọn định dạng và xuất file như mục 3.3 có được không?
- Giới hạn kích thước file và số ký tự được gửi kèm là bao nhiêu?

---

## 4. Thứ tự thực hiện

Mỗi phần là một thay đổi riêng, có test, chuỗi i18n và cập nhật SRS.

1. Prompt caching, sắp lại system prompt và đo số token (vấn đề 1, phương án A).
2. Rút gọn thông báo (vấn đề 2, bước 1).
3. Import PDF/Word và xuất Markdown (vấn đề 3).
4. Tùy chọn, sau khi có số liệu: lỗi dịch theo `code` (vấn đề 2, bước 2), và agent tự lấy ngữ cảnh (vấn đề 1, phương án B).
