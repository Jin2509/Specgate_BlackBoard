# SpecGate Workspace: Đặc tả yêu cầu phần mềm (SRS)

| Mục | Nội dung |
| --- | --- |
| Phiên bản | 0.2 (bản nháp để rà soát) |
| Ngày | 13/11/2026 |
| Nguồn | `overallweb.md`, `docs/UI_FLOW.md`, `docs/SCRIPT4_PHAN_HOI.md`, mô hình ngữ cảnh của trưởng nhóm (13/11), mã giao diện `web_ui/` |
| Trạng thái | Chờ nhóm rà soát; các điểm chưa chốt ghi ở mục 8; thay đổi so với 0.1 ghi ở mục 10 |

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu đặc tả những gì website SpecGate Workspace phải làm **cho người dùng cuối**: người cần hệ thống để lên ý tưởng cùng người khác, mỗi người với agent LLM của riêng mình. Tài liệu dùng để làm, kiểm thử và nghiệm thu.

### 1.2. Phạm vi

Website gồm hai phần:

- **Workspace riêng**: mỗi người chat với **agent riêng** của mình bằng API key của mình. Một hội thoại có thể gắn một workspace chung làm ngữ cảnh nhóm; câu trả lời của agent gửi thẳng vào kênh của workspace chung đó.
- **Workspace chung**: nơi cả nhóm và câu trả lời của agent các thành viên gặp nhau: kênh chat thời gian thực, highlight để đưa tin của người khác vào ngữ cảnh agent của mình, bảng ý tưởng có trạng thái chốt/loại kèm lý do, bản tổng hợp.

Tài liệu **không** đặc tả:

- Việc quản trị hệ thống (quản trị viên, kiểm duyệt nội dung, giám sát, sao lưu, vận hành máy chủ).
- Mô-đun ADOM (pipeline bài báo, số liệu thí nghiệm, các lệnh `/stats`, `/task`, `/run`) do nhóm khác phụ trách.
- Các việc "làm sau" và ngoài phạm vi ở mục 7.

### 1.3. Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Agent riêng | Mô hình LLM một người chọn ở workspace riêng, chạy bằng key của người đó. Mỗi người một agent. Agent riêng và agent gửi tin vào kênh chung là một |
| Chủ agent | Người sở hữu agent riêng (người nhập key) |
| Workspace riêng | Không gian chỉ một người thấy, chứa các hội thoại với agent riêng của người đó |
| Workspace chung | Không gian nhiều người, có kênh, bảng ý tưởng và thành viên. Không có agent của riêng workspace |
| Chủ workspace | Người tạo workspace chung |
| Thành viên | Người đã được duyệt vào workspace chung (gồm cả chủ) |
| Vai trong nhóm | Một dòng mỗi thành viên tự mô tả việc của mình trong workspace chung, ví dụ "Dựng khung", "Runner". Agent của mọi thành viên đọc được |
| Hội thoại gắn workspace | Hội thoại riêng đã chọn một workspace chung làm ngữ cảnh nhóm |
| Ngữ cảnh nhóm | Phần dữ liệu từ workspace chung gửi kèm mỗi lời gọi mô hình của hội thoại gắn workspace (xem FR-26) |
| Tin của mình | Trong một kênh: tin người đó nhắn và tin agent riêng của người đó đã gửi |
| Highlight | Bản chụp một đoạn người dùng bôi đen trong tin của **người khác** ở kênh chung, kèm nhãn _Quan trọng_ hoặc _Cần xem xét_ và người nói. Chỉ người tạo thấy |
| Người nói | Tác giả của tin được highlight: một người, hoặc agent của một người (ghi "&lt;mô hình&gt; của &lt;tên&gt;") |
| Bảng ý tưởng | Bảng bốn cột: Đề xuất, Đang bàn, Đã chốt, Đã loại |
| Mã tham gia | Mã 7 ký tự do hệ thống sinh để xin vào một workspace chung |
| Bản tổng hợp | Văn bản dựng từ bảng ý tưởng, tải được dạng Markdown |

## 2. Mô tả tổng quát

### 2.1. Bài toán

Hai người cùng làm một việc, mỗi người hỏi một agent riêng, có thể khác nhà cung cấp. Ví dụ Lan dựng khung và dùng Claude, Long làm runner và dùng DeepSeek. Mỗi người tự mô tả vai của mình cho agent. Khi Claude của Lan đề nghị "hãy hỏi runner những câu này", Lan phải copy sang chat nhóm, Long copy vào DeepSeek, lọc câu trả lời rồi dán lại, Lan lại copy vào Claude: "Runner đã phản hồi…". Mỗi vòng hỏi đáp là bốn lần copy và dán, và agent không biết đoạn nào do ai nói.

SpecGate bỏ vòng copy này:

1. Câu trả lời của agent riêng gửi thẳng vào kênh chung, ghi rõ là agent của ai.
2. Agent riêng tự đọc mọi tin của chủ nó trong kênh.
3. Tin của người khác (người hoặc agent) chỉ vào ngữ cảnh khi chủ agent **highlight**, kèm tên người nói. Ngữ cảnh do con người chọn lọc, không phải toàn bộ đoạn chat.

### 2.2. Tác nhân

| Tác nhân | Mô tả |
| --- | --- |
| Khách | Chưa đăng nhập. Chỉ thấy trang đăng nhập/đăng ký |
| Người dùng | Đã đăng nhập. Có workspace riêng và agent riêng (khi đã nhập key); có thể tạo hoặc xin vào workspace chung |
| Thành viên | Người dùng đã thuộc một workspace chung |
| Chủ workspace | Thành viên đã tạo workspace chung đó; có thêm quyền duyệt, tổng hợp, cấu hình |
| Nhà cung cấp đăng nhập (ngoài) | Google, GitHub |
| Nhà cung cấp LLM (ngoài) | Anthropic hoặc dịch vụ dùng định dạng API kiểu OpenAI |

Một người có thể là thành viên ở workspace này và là chủ ở workspace khác.

### 2.3. Ràng buộc

- Chỉ đăng nhập bằng Google hoặc GitHub; không có mật khẩu riêng.
- Chỉ dùng API key; gói thuê bao (ChatGPT Plus, Claude Pro…) không dùng được.
- Hỗ trợ hai bộ chuyển đổi LLM: Anthropic và định dạng kiểu OpenAI (OpenAI, OpenRouter, DeepSeek, Groq, Ollama… chỉ khác địa chỉ API).
- Mọi lời gọi mô hình đi qua backend, không gọi từ trình duyệt.
- Giao diện tiếng Việt.
- Công nghệ theo `overallweb.md` mục 5.

### 2.4. Giả định

- Người dùng tự có API key hợp lệ và tự chịu chi phí của key đó.
- Mọi lời gọi mô hình, kể cả câu trả lời sau đó được gửi vào kênh chung, đều chạy bằng key của chủ agent.

## 3. Ca sử dụng

### 3.1. Danh sách

| Mã | Ca sử dụng | Tác nhân chính |
| --- | --- | --- |
| UC01 | Đăng nhập / đăng ký | Khách |
| UC02 | Thiết lập API key (tạo agent riêng) | Người dùng |
| UC03 | Chat với agent riêng | Người dùng |
| UC04 | Gắn hội thoại với workspace chung | Thành viên |
| UC05 | Gửi câu trả lời của agent vào kênh | Thành viên |
| UC06 | Highlight trong kênh chung | Thành viên |
| UC07 | Tạo workspace chung | Người dùng |
| UC08 | Xin tham gia workspace chung | Người dùng |
| UC09 | Duyệt yêu cầu tham gia | Chủ workspace |
| UC10 | Nhắn tin trong kênh | Thành viên |
| UC11 | Đưa ý lên bảng ý tưởng | Thành viên |
| UC12 | Chốt hoặc loại ý | Thành viên |
| UC13 | Tổng hợp và xuất bản tổng hợp | Chủ workspace |
| UC14 | Đặt vai trong nhóm | Thành viên |
| UC15 | Cấu hình workspace chung | Chủ workspace |

### 3.2. Đặc tả từng ca

#### UC01. Đăng nhập / đăng ký

- **Tiền điều kiện:** chưa đăng nhập.
- **Luồng chính:**
  1. Khách mở bất kỳ trang nào; hệ thống chuyển về trang đăng nhập và nhớ trang định mở.
  2. Khách chọn Google hoặc GitHub (ở chế độ Đăng nhập hoặc Tạo tài khoản).
  3. Nhà cung cấp xác thực và trả về danh tính.
  4. Nếu tài khoản chưa có: hệ thống tạo tài khoản kèm workspace riêng, chuyển sang màn nhập key (UC02).
  5. Nếu tài khoản đã có: hệ thống đăng nhập, mở lại trang định mở hoặc workspace dùng gần nhất.
- **Luồng phụ:** người dùng đăng xuất từ khung người dùng; phiên kết thúc, quay về trang đăng nhập.
- **Ngoại lệ:** người dùng hủy ở bước nhà cung cấp → quay lại trang đăng nhập, không tạo tài khoản.
- **Hậu điều kiện:** có phiên đăng nhập; mỗi danh tính Google/GitHub ứng với đúng một tài khoản.

#### UC02. Thiết lập API key

- **Tiền điều kiện:** đã đăng nhập.
- **Luồng chính:**
  1. Người dùng chọn nhà cung cấp (Anthropic hoặc kiểu OpenAI; với kiểu OpenAI nhập thêm địa chỉ API).
  2. Người dùng dán API key.
  3. Hệ thống kiểm key với nhà cung cấp và trả danh sách mô hình.
  4. Người dùng chọn mô hình; hệ thống lưu key đã mã hóa. Mô hình đã chọn là agent riêng của người dùng.
- **Luồng phụ:** người dùng thay key hoặc đổi mô hình sau này bằng cùng màn này. Các tin agent đã gửi vào kênh giữ tên mô hình lúc gửi.
- **Ngoại lệ:** key sai, hết hạn mức, không kết nối được → báo lỗi dễ hiểu, không lưu key.
- **Hậu điều kiện:** giao diện chỉ hiện 4 ký tự cuối của key.

#### UC03. Chat với agent riêng

- **Tiền điều kiện:** đã có key hợp lệ (UC02).
- **Luồng chính:**
  1. Người dùng tạo hội thoại mới hoặc mở hội thoại cũ trong danh sách. Với hội thoại mới, người dùng có thể chọn trước workspace chung làm ngữ cảnh (UC04).
  2. Người dùng gửi tin.
  3. Hệ thống gửi tới mô hình đã chọn, bằng key của người dùng: lịch sử hội thoại và, nếu hội thoại gắn workspace chung, ngữ cảnh nhóm (FR-26).
  4. Câu trả lời hiện dần (stream) và được lưu vào hội thoại.
- **Luồng phụ:** người dùng xóa một hội thoại; tin đã gửi vào kênh và highlight vẫn còn.
- **Ngoại lệ:** nhà cung cấp trả lỗi (key bị thu hồi, hết hạn mức, quá giới hạn ngữ cảnh) → hiện câu báo lỗi trong hội thoại, tin của người dùng không mất.
- **Hậu điều kiện:** chỉ chủ hội thoại xem được hội thoại.

#### UC04. Gắn hội thoại với workspace chung

- **Tiền điều kiện:** đang mở một hội thoại riêng; là thành viên của ít nhất một workspace chung.
- **Luồng chính:**
  1. Người dùng chọn một workspace chung ở ô "Ngữ cảnh nhóm" của hội thoại.
  2. Hệ thống lưu lựa chọn; khung "Agent đang đọc" hiện đúng phần ngữ cảnh nhóm sẽ gửi kèm: vai của mình, đội, bảng ý tưởng, tin của mình, các đoạn đã highlight kèm người nói.
- **Luồng phụ:** người dùng chọn "Không gắn" để bỏ ngữ cảnh nhóm; bỏ một highlight ngay trong khung "Agent đang đọc".
- **Ngoại lệ:** không còn là thành viên workspace đó → không gắn được.
- **Hậu điều kiện:** mỗi hội thoại gắn tối đa một workspace chung.

#### UC05. Gửi câu trả lời của agent vào kênh

- **Tiền điều kiện:** hội thoại đã gắn workspace chung (UC04); có ít nhất một câu trả lời của agent.
- **Luồng chính:**
  1. Người dùng bấm "Gửi vào kênh" dưới một câu trả lời, hoặc bôi đen một đoạn trong câu trả lời rồi bấm "Gửi đoạn này vào kênh".
  2. Hệ thống mở hộp thoại: nội dung sửa được (để lọc bớt), chọn kênh, ghi rõ tin sẽ hiện dưới tên "&lt;mô hình&gt; của &lt;tên&gt;".
  3. Người dùng gửi; tin hiện trong kênh cho mọi thành viên, tên người gửi là agent của người dùng.
- **Ngoại lệ:** nội dung trống → không cho gửi; không còn là thành viên → báo lỗi.
- **Hậu điều kiện:** tin lưu tên mô hình lúc gửi và chủ agent; hội thoại gốc không đi theo và không ai khác mở được.

#### UC06. Highlight trong kênh chung

- **Tiền điều kiện:** là thành viên, đang mở một kênh.
- **Luồng chính:**
  1. Người dùng bôi đen một đoạn trong tin của người khác hoặc của agent người khác.
  2. Người dùng bấm "Highlight cho agent của tôi", chọn nhãn _Quan trọng_ hoặc _Cần xem xét_.
  3. Hệ thống hiện đoạn đã chọn để xem và sửa, kèm tên người nói.
  4. Người dùng lưu; đoạn vào "Highlight của tôi", được tô vệt phấn trong kênh (chỉ người đó thấy), và vào ngữ cảnh nhóm của mọi hội thoại riêng gắn workspace này.
- **Luồng phụ:** người dùng xem, xóa highlight ở "Highlight của tôi" hoặc ở khung "Agent đang đọc".
- **Ngoại lệ:** bôi đen trong tin của chính mình hoặc agent của mình → không có nút Highlight; hệ thống nhắc rằng tin này đã tự vào ngữ cảnh.
- **Hậu điều kiện:** highlight lưu bản chụp văn bản, người nói, kênh và tin gốc; không lưu vị trí ký tự.

#### UC07. Tạo workspace chung

- **Tiền điều kiện:** đã đăng nhập.
- **Luồng chính:**
  1. Người dùng mở hộp thoại tạo workspace.
  2. Nhập tên, đề bài (bắt buộc), chọn hiển thị: ẩn hoặc ai cũng tìm thấy.
  3. Hệ thống tạo workspace với một kênh mặc định.
- **Ngoại lệ:** thiếu tên hoặc đề bài → không cho tạo, báo trường thiếu.
- **Hậu điều kiện:** người tạo là chủ workspace. Workspace không có agent của riêng nó; mỗi thành viên mang agent riêng của mình.

#### UC08. Xin tham gia workspace chung

- **Tiền điều kiện:** đã đăng nhập, chưa là thành viên workspace đó.
- **Luồng chính A (bằng mã):**
  1. Một thành viên mở "Chia sẻ mã tham gia" và gửi mã 7 ký tự cho người dùng (ngoài hệ thống).
  2. Người dùng nhập mã.
  3. Hệ thống tạo yêu cầu và chuyển sang trang "Đang chờ duyệt".
- **Luồng chính B (qua Khám phá):**
  1. Người dùng tìm workspace công khai theo tên hoặc đề bài ở trang Khám phá.
  2. Người dùng gửi yêu cầu kèm lời nhắn.
- **Luồng phụ:** người dùng hủy yêu cầu đang chờ.
- **Ngoại lệ:** mã sai hoặc đã bị đổi → báo mã không hợp lệ; đã có yêu cầu đang chờ → không tạo trùng.
- **Hậu điều kiện:** yêu cầu ở trạng thái chờ; khi được duyệt, trang chờ tự chuyển vào workspace.

#### UC09. Duyệt yêu cầu tham gia

- **Tiền điều kiện:** là chủ workspace, có yêu cầu đang chờ.
- **Luồng chính:**
  1. Chủ mở trang Yêu cầu tham gia (tự làm mới).
  2. Chủ xem người xin, cách xin (mã hoặc Khám phá), lời nhắn.
  3. Chủ bấm Duyệt hoặc Từ chối.
- **Hậu điều kiện:** Duyệt → người xin thành thành viên. Từ chối → yêu cầu đóng. Yêu cầu đã xử lý vào lịch sử.

#### UC10. Nhắn tin trong kênh

- **Tiền điều kiện:** là thành viên.
- **Luồng chính:**
  1. Thành viên soạn tin; gõ `@` để nhắc tên người; gõ `/` để gợi ý lệnh.
  2. Thành viên gửi tin; mọi thành viên thấy tin trong thời gian thực.
- **Luồng phụ:** tin chứa lệnh thì thực thi lệnh (UC11–UC13).
- **Hậu điều kiện:** tin vào ngữ cảnh agent riêng của người gửi (tin của mình). Không agent nào tự trả lời trong kênh.

#### UC11. Đưa ý lên bảng ý tưởng

- **Tiền điều kiện:** là thành viên.
- **Luồng chính:** thành viên dùng `/idea <nội dung>`, `/pin` (khi đang trả lời một tin, kể cả tin của agent) hoặc `/note <nội dung>`; hệ thống thêm thẻ vào cột Đề xuất (ý) hoặc mục ghi chú, kèm nguồn.
- **Hậu điều kiện:** mỗi thẻ có số thứ tự, người tạo (người, hoặc agent của ai), thời điểm, nguồn.

#### UC12. Chốt hoặc loại ý

- **Tiền điều kiện:** là thành viên; ý chưa ở Đã chốt hoặc Đã loại.
- **Luồng chính:**
  1. Thành viên chọn Chốt hoặc Loại trên thẻ, hoặc gõ `/decide #<số> chốt|loại <lý do>`.
  2. Thành viên nhập lý do (bắt buộc).
  3. Hệ thống chuyển thẻ sang cột tương ứng, ghi người quyết định, thời điểm, lý do.
- **Ngoại lệ:** thiếu lý do → không cho xác nhận; lệnh nằm trong tin do agent gửi → không thực thi.
- **Hậu điều kiện:** thẻ không quay lại được cột trước; cột Đã loại vẫn hiển thị.

#### UC13. Tổng hợp và xuất bản tổng hợp

- **Tiền điều kiện:** là chủ workspace.
- **Luồng chính:**
  1. Chủ gõ `/summarize`; agent riêng của chủ tóm tắt kênh bằng key của chủ, kết quả hiện trong kênh dưới tên agent của chủ.
  2. Chủ gõ `/brief`; hệ thống dựng bản tổng hợp từ bảng: ý đã chốt, đã loại kèm lý do, đang bàn.
  3. Mọi thành viên xem và tải bản tổng hợp dạng Markdown.
- **Ngoại lệ:** thành viên thường dùng `/summarize` hoặc `/brief` → nhận tin từ chối kèm lý do; chủ chưa có key → `/summarize` báo cần nhập key.

#### UC14. Đặt vai trong nhóm

- **Tiền điều kiện:** là thành viên.
- **Luồng chính:** thành viên nhập vai của mình (tối đa 40 ký tự) ở khung "Agent đang đọc" của một hội thoại gắn workspace đó, rồi lưu.
- **Hậu điều kiện:** vai hiện ở danh sách thành viên; agent riêng của mọi thành viên đọc được vai này trong ngữ cảnh nhóm. Mỗi người chỉ sửa được vai của mình.

#### UC15. Cấu hình workspace chung

- **Tiền điều kiện:** là chủ workspace.
- **Luồng chính:** chủ có thể sửa đề bài, đổi mã tham gia (mã cũ hết hiệu lực ngay), tạo kênh mới.
- **Luồng phụ:** mọi thành viên xem được danh sách thành viên: quyền (chủ/thành viên), vai trong nhóm, agent riêng (mô hình, nhà cung cấp). Không ai thấy key của người khác.

## 4. Yêu cầu chức năng

Mỗi yêu cầu kiểm được bằng một ca kiểm thử. Mức: **M** = bắt buộc trong đợt này.

### 4.1. Tài khoản (UC01)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-01 | Mọi trang trừ trang đăng nhập đều yêu cầu đăng nhập; chưa đăng nhập thì chuyển về trang đăng nhập và quay lại đúng trang sau khi đăng nhập | M |
| FR-02 | Chỉ có hai cách đăng nhập/đăng ký: Google và GitHub | M |
| FR-03 | Lần đầu đăng ký, hệ thống tạo tài khoản và workspace riêng rồi chuyển sang màn nhập key | M |
| FR-04 | Danh tính Google/GitHub đã đăng ký thì đăng nhập luôn, không tạo tài khoản trùng | M |
| FR-05 | Người dùng đăng xuất được | M |

### 4.2. Workspace riêng và agent riêng (UC02–UC05)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-10 | Người dùng chọn nhà cung cấp (Anthropic hoặc kiểu OpenAI kèm địa chỉ API) và nhập API key | M |
| FR-11 | Hệ thống kiểm key ngay khi nhập; hợp lệ thì trả danh sách mô hình để chọn | M |
| FR-12 | Key sai, hết hạn mức hoặc không kết nối được thì hiện thông báo dễ hiểu và không lưu key | M |
| FR-13 | Màn nhập key ghi rõ gói thuê bao (ChatGPT Plus, Claude Pro…) không phải API key | M |
| FR-14 | Sau khi lưu, giao diện chỉ hiện 4 ký tự cuối của key; không có cách xem lại key đầy đủ | M |
| FR-15 | Người dùng tạo, mở, xóa hội thoại; có danh sách hội thoại; hội thoại gắn workspace chung có dấu hiệu riêng trong danh sách | M |
| FR-16 | Hội thoại nhiều lượt: mỗi lời gọi gửi kèm lịch sử hội thoại | M |
| FR-17 | Câu trả lời hiện dần (stream) | M |
| FR-18 | Workspace riêng không có kênh, bảng ý tưởng hay thành viên; chỉ chủ hội thoại xem được hội thoại | M |
| FR-19 | Mỗi người có đúng một agent riêng là mô hình đang chọn; tên hiển thị của agent ở mọi nơi là "&lt;mô hình&gt; của &lt;tên&gt;" | M |
| FR-25 | Hội thoại gắn được tối đa một workspace chung mà người dùng là thành viên, đổi hoặc bỏ gắn bất cứ lúc nào; hội thoại mới chọn được workspace trước câu hỏi đầu | M |
| FR-26 | Với hội thoại gắn workspace chung, mỗi lời gọi mô hình gửi kèm ngữ cảnh nhóm gồm: đề bài; đội (tên, vai trong nhóm, mô hình agent của từng người); ý đã chốt và đã loại kèm lý do; mọi tin của mình trong các kênh của workspace đó; các đoạn mình đã highlight trong workspace đó kèm người nói và nhãn "chưa chốt". Không gửi tin nào khác của người khác | M |
| FR-27 | Cạnh hội thoại có khung "Agent đang đọc" hiện đúng nội dung ngữ cảnh nhóm ở FR-26; bỏ được highlight ngay trong khung | M |
| FR-28 | Hội thoại gắn workspace chung: mỗi câu trả lời của agent có nút "Gửi vào kênh"; bôi đen một đoạn trong câu trả lời thì có nút "Gửi đoạn này vào kênh" | M |
| FR-29 | Trước khi gửi vào kênh, người dùng sửa được nội dung và chọn kênh; hộp thoại ghi rõ tin sẽ hiện dưới tên agent nào | M |

### 4.3. Highlight trong kênh chung (UC06)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-20 | Bôi đen một đoạn trong tin của người khác hoặc agent của người khác ở kênh chung rồi tạo highlight với một trong hai nhãn _Quan trọng_, _Cần xem xét_ | M |
| FR-21 | Trước khi lưu highlight, người dùng xem và sửa được văn bản đã chọn; hộp thoại ghi tên người nói | M |
| FR-22 | Highlight lưu bản chụp văn bản, người nói (người, hoặc mô hình và chủ agent), kênh và tin gốc; xóa hội thoại riêng không ảnh hưởng highlight | M |
| FR-23 | Tin của chính mình và của agent mình không highlight được; bôi đen những tin này hiện lời nhắc rằng chúng đã tự vào ngữ cảnh | M |
| FR-24 | Chỉ người tạo thấy highlight của mình: trong danh sách "Highlight của tôi" (nhóm theo workspace, ghi người nói và kênh) và dưới dạng vệt phấn trong kênh | M |

### 4.4. Tham gia workspace chung (UC07–UC09)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-30 | Tạo workspace chung với tên, đề bài bắt buộc, hiển thị ẩn hoặc ai cũng tìm thấy; workspace không có agent của riêng nó | M |
| FR-31 | Mỗi workspace chung có một mã tham gia 7 ký tự do hệ thống sinh; mọi thành viên xem và chép được mã | M |
| FR-32 | Chủ đổi được mã; mã cũ hết hiệu lực ngay | M |
| FR-33 | Nhập mã hợp lệ tạo yêu cầu chờ duyệt và chuyển sang trang "Đang chờ duyệt" | M |
| FR-34 | Trang Khám phá liệt kê workspace công khai, tìm theo tên/đề bài, hiện trạng thái quan hệ (chưa tham gia, đang chờ, đã là thành viên) | M |
| FR-35 | Từ Khám phá, người dùng gửi yêu cầu kèm lời nhắn | M |
| FR-36 | Người xin hủy được yêu cầu đang chờ; mỗi người có tối đa một yêu cầu đang chờ cho mỗi workspace | M |
| FR-37 | Chỉ chủ thấy trang Yêu cầu tham gia; trang tự làm mới; có Duyệt, Từ chối và lịch sử đã xử lý | M |
| FR-38 | Khi được duyệt, trang chờ của người xin tự chuyển vào workspace | M |
| FR-39 | Mở workspace chưa là thành viên thì chuyển sang Khám phá, chọn sẵn workspace đó | M |

### 4.5. Kênh (UC10)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-40 | Tin nhắn phân biệt người, agent (ghi mô hình và chủ agent) và hệ thống | M |
| FR-41 | Tin mới hiện cho mọi thành viên đang mở kênh | M |
| FR-42 | Gõ `@` gợi ý người trong workspace; gõ `/` gợi ý lệnh; chọn được bằng bàn phím | M |
| FR-43 | Kênh không có agent tự trả lời: nhắc tên người hay agent đều không kích hoạt lời gọi mô hình | M |
| FR-44 | Cột bên của workspace chung liệt kê agent riêng của các thành viên (mô hình và chủ) | M |
| FR-49 | `/help` hiện danh sách lệnh | M |

### 4.6. Bảng ý tưởng và tổng hợp (UC11–UC13)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-50 | Bảng có bốn cột: Đề xuất, Đang bàn, Đã chốt, Đã loại; trạng thái phân biệt bằng cột và chữ, không tô màu | M |
| FR-51 | `/idea`, `/pin`, `/note` thêm thẻ lên bảng kèm nguồn; thẻ từ tin của agent ghi "Agent của &lt;tên&gt;" | M |
| FR-52 | Chốt hoặc loại bắt buộc lý do; chỉ người làm được; ghi người quyết định và thời điểm | M |
| FR-53 | Thẻ đã chốt/đã loại không chuyển lại cột khác | M |
| FR-54 | `/summarize`, `/brief` chỉ chủ dùng được; thành viên thường nhận tin từ chối kèm lý do | M |
| FR-55 | `/summarize` chạy bằng agent riêng và key của chủ workspace; kết quả hiện dưới tên agent của chủ | M |
| FR-56 | Bản tổng hợp gồm ý đã chốt, đã loại kèm lý do, đang bàn; mọi thành viên xem và tải dạng Markdown | M |

### 4.7. Đội và cấu hình (UC14, UC15)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-60 | Chủ sửa được đề bài và tạo kênh mới | M |
| FR-61 | Mỗi thành viên đặt được vai trong nhóm của chính mình (tối đa 40 ký tự); không sửa được vai của người khác | M |
| FR-62 | Mọi thành viên xem danh sách thành viên: quyền, vai trong nhóm, agent riêng (mô hình, nhà cung cấp) hoặc "chưa nhập key"; không hiện key của ai | M |

## 5. Quy tắc nghiệp vụ

| Mã | Quy tắc |
| --- | --- |
| BR-01 | Mỗi người một agent riêng. Agent dùng ở workspace riêng và agent gửi tin vào kênh chung là một |
| BR-02 | Mọi lời gọi mô hình chạy bằng key của chủ agent; chi phí tính vào key đó. Riêng `/summarize` dùng agent và key của chủ workspace |
| BR-03 | Tin của agent trong kênh luôn ghi rõ là agent của ai; chỉ chủ agent gửi được tin dưới tên agent của mình |
| BR-04 | Agent riêng tự đọc tin của chủ nó trong kênh (kể cả tin agent đó đã gửi); tin của người khác chỉ vào ngữ cảnh khi chủ agent highlight |
| BR-05 | Highlight chỉ là đánh dấu cho agent của người tạo, chưa phải chốt; không tự vào bảng ý tưởng; chỉ người tạo thấy |
| BR-06 | Chỉ phần được gửi vào kênh mới rời workspace riêng; không ai mở được hội thoại riêng của người khác |
| BR-07 | Chốt và loại chỉ người làm, bắt buộc lý do, không quay ngược; agent không chốt được |
| BR-08 | Lệnh chỉ thực thi khi do người gửi, không do tin của agent |
| BR-09 | Tổng hợp (`/summarize`, `/brief`) là quyền của chủ workspace |
| BR-10 | Cả hai đường vào workspace chung (mã, Khám phá) đều chờ chủ duyệt; không có liên kết vào thẳng |

## 6. Yêu cầu phi chức năng

| Mã | Loại | Yêu cầu |
| --- | --- | --- |
| NFR-01 | Bảo mật | API key mã hóa khi lưu, chỉ ghi không đọc lại; không xuất hiện trong log, phản hồi API hay tab Network của trình duyệt |
| NFR-02 | Bảo mật | Mọi lời gọi mô hình đi qua backend |
| NFR-03 | Phân quyền | Mỗi thao tác kiểm quyền ở backend (thành viên, chủ, chủ hội thoại, chủ highlight); không dựa vào việc ẩn nút trên giao diện |
| NFR-04 | Riêng tư | Hội thoại riêng và highlight chỉ chủ của chúng đọc được, kể cả qua API |
| NFR-05 | Hiệu năng | Tin nhắn mới tới các thành viên khác trong dưới 2 giây |
| NFR-06 | Hiệu năng | Câu trả lời agent bắt đầu hiện ngay khi nhà cung cấp trả token đầu tiên (stream) |
| NFR-07 | Chi phí | Ngữ cảnh nhóm có giới hạn kích thước; khi vượt, cắt bớt tin cũ nhất của mình trước, không cắt highlight (xem mục 8) |
| NFR-08 | Dễ dùng | Lỗi nhà cung cấp (401, 429, mất kết nối) hiện thành câu tiếng Việt dễ hiểu |
| NFR-09 | Dễ dùng | Mỗi màn có trạng thái đang tải, rỗng, lỗi |
| NFR-10 | Truy cập | Thao tác chính dùng được bằng bàn phím; độ tương phản chữ đạt WCAG AA |
| NFR-11 | Tương thích | Dùng được trên trình duyệt desktop phổ biến bản mới; bố cục không vỡ ở màn hình hẹp |

## 7. Ngoài phạm vi

**Làm sau, nếu còn thời gian** (không đặc tả ở đây):

- Chia sẻ cả một hội thoại vào kênh chung.
- Mời qua email hoặc GitHub.
- Hiển thị số liệu ADOM trên web.

**Không làm:**

- Quản trị hệ thống và mọi chức năng của quản trị viên.
- Agent của riêng workspace chung (agent theo vai dùng key của chủ), agent tự trả lời trong kênh khi được gọi tên, agent gọi agent.
- Tiện ích trình duyệt; đăng nhập bằng tài khoản của nhà cung cấp LLM thay cho API key.
- Công cụ của agent (chạy code, duyệt web); tải tệp và ảnh vào chat.
- Nhiều key hoặc nhiều agent cho một người.
- Mật khẩu riêng, đăng nhập bằng email.

## 8. Điểm cần xác nhận

Tài liệu đang chọn phương án ghi trong ngoặc; nhóm xác nhận hoặc đổi.

1. **`/summarize` chạy bằng agent nào**: (agent riêng và key của chủ workspace). Phương án khác: bỏ `/summarize`, chỉ giữ `/brief` dựng từ bảng.
2. **Nhắc tên trong kênh**: tin nhắc `@Lan` có tự vào ngữ cảnh agent của Lan không (không, Lan vẫn phải highlight).
3. **Highlight có hiện cho người khác không**: (không, chỉ người tạo thấy). Nếu cần cho người nói biết ai đang đọc ý mình, có thể thêm số đếm.
4. **Giới hạn ngữ cảnh nhóm** (NFR-07): số tin của mình tối đa (đề xuất 50 tin gần nhất) và số highlight tối đa.
5. **Câu hỏi mở và tóm tắt cuộn trên bảng ý tưởng**: `UI_FLOW.md` màn 06 có, `overallweb.md` không có. Đề xuất bỏ để giữ phạm vi gọn.
6. **Ghi chú (`/note`)**: có trong giao diện, `overallweb.md` không nhắc. Tài liệu đang giữ (FR-51).
7. **Ai được tạo kênh mới**: (chỉ chủ, FR-60).
8. **Ai được chuyển ý từ Đề xuất sang Đang bàn**, và có cần thao tác riêng không.
9. **Thành viên rời workspace, chủ xóa thành viên, xóa workspace**: chưa có nguồn nào nhắc; khi rời, highlight và hội thoại gắn workspace đó xử lý thế nào.

## 9. Truy vết

| Ca sử dụng | Yêu cầu chức năng | Quy tắc |
| --- | --- | --- |
| UC01 | FR-01 – FR-05 | |
| UC02 | FR-10 – FR-14, FR-19 | BR-01 |
| UC03 | FR-15 – FR-18, FR-26 | BR-02, BR-04, BR-06 |
| UC04 | FR-25 – FR-27 | BR-04 |
| UC05 | FR-28, FR-29, FR-40 | BR-01, BR-03, BR-06 |
| UC06 | FR-20 – FR-24 | BR-04, BR-05 |
| UC07 | FR-30 | |
| UC08 | FR-31, FR-33 – FR-36, FR-38, FR-39 | BR-10 |
| UC09 | FR-37 | BR-10 |
| UC10 | FR-40 – FR-44, FR-49 | BR-04, BR-08 |
| UC11 | FR-50, FR-51 | BR-05 |
| UC12 | FR-52, FR-53 | BR-07, BR-08 |
| UC13 | FR-54 – FR-56 | BR-02, BR-09 |
| UC14 | FR-61, FR-62 | |
| UC15 | FR-32, FR-60, FR-62 | |

## 10. Thay đổi so với bản 0.1

Theo mô hình ngữ cảnh trưởng nhóm đưa ra ngày 13/11/2026. Khi bản 0.1 xung đột với mô hình này, tài liệu theo trưởng nhóm.

| Chủ đề | Bản 0.1 | Bản 0.2 |
| --- | --- | --- |
| Agent trong kênh | Ba agent theo vai (Phát ý, Phản biện, Tổng hợp) thuộc workspace chung | Không có agent của workspace; mỗi thành viên mang agent riêng, agent riêng và agent trong kênh là một |
| Key | Agent trong kênh dùng key của chủ, có trần chi phí | Mọi agent dùng key của chủ agent; bỏ trần chi phí |
| Gọi agent | Gọi `@agent` trong kênh, agent trả lời, xếp hàng theo kênh, agent gọi agent tối đa 2 lượt | Agent trả lời ở workspace riêng; chủ agent gửi câu trả lời vào kênh (UC05). Bỏ hàng đợi và luật agent gọi agent |
| Hướng highlight | Bôi đen ở workspace riêng, gửi vào kênh bằng `@` | Bôi đen tin của người khác ở kênh chung, đưa vào ngữ cảnh agent riêng của mình (UC06) |
| Ngữ cảnh agent | Đề bài, bảng, tin gần đây của kênh, highlight được tham chiếu | Đề bài, đội và vai, bảng, mọi tin của mình, highlight của mình kèm người nói (FR-26) |
| Biết người nói | Không yêu cầu | Highlight và tin của agent luôn ghi người nói; agent phản hồi được theo người nói |
| Vai | Vai của agent | Vai trong nhóm của người, do từng người tự ghi (UC14) |
| "Đưa lên bảng" từ highlight | Chủ đưa highlight lên cột Đề xuất | Bỏ; highlight là riêng của từng người. Đưa ý lên bảng bằng `/idea`, `/pin` |
| Ca sử dụng | UC01–UC12 | UC01–UC15 (thêm UC04 gắn workspace, UC05 gửi vào kênh, UC14 vai trong nhóm; UC06 highlight viết lại) |
