# SpecGate Workspace (Sàng Ý): Đặc tả yêu cầu phần mềm

| Mục | Nội dung |
| --- | --- |
| Phiên bản | 0.3 |
| Ngày | 18/11/2026 |
| Nguồn | `flow.md` (bản đã chốt), mã nguồn `web_ui/` và `backend/` |
| Trạng thái | Bản đặc tả theo flow đã chốt; các điểm còn mở ghi ở mục 9 |
| Thay thế | Bản 0.2 (13/11/2026); khác biệt ghi ở mục 11 |

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Mô tả tổng quát](#2-mô-tả-tổng-quát)
3. [Danh sách ca sử dụng](#3-danh-sách-ca-sử-dụng)
4. [Đặc tả chi tiết từng ca sử dụng](#4-đặc-tả-chi-tiết-từng-ca-sử-dụng)
5. [Yêu cầu chức năng](#5-yêu-cầu-chức-năng)
6. [Quy tắc nghiệp vụ](#6-quy-tắc-nghiệp-vụ)
7. [Yêu cầu phi chức năng](#7-yêu-cầu-phi-chức-năng)
8. [Ngoài phạm vi và việc làm sau](#8-ngoài-phạm-vi-và-việc-làm-sau)
9. [Điểm còn mở](#9-điểm-còn-mở)
10. [Ma trận truy vết](#10-ma-trận-truy-vết)
11. [Thay đổi so với bản 0.2](#11-thay-đổi-so-với-bản-02)
12. [Phụ lục: sơ đồ UML](#12-phụ-lục-sơ-đồ-uml)

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu đặc tả những gì website SpecGate Workspace phải làm cho người dùng cuối: những người cùng lên ý tưởng với nhau, mỗi người mang theo một agent AI của riêng mình. Tài liệu dùng làm căn cứ để phát triển, kiểm thử và nghiệm thu.

Kỹ thuật cốt lõi là **dựng ngữ cảnh cho agent có con người tham gia** (human-in-the-loop context engineering): con người chọn lọc những gì agent được đọc, và mỗi đoạn agent đọc đều ghi rõ ai đã nói.

### 1.2. Bài toán

Khi một nhóm cùng lên ý tưởng, mỗi người hỏi một agent riêng (Claude, DeepSeek, ChatGPT…), mỗi người một phiên chat, và các phiên này không thấy nhau. Muốn agent hiểu nhóm đang bàn gì, mọi người phải tự copy và dán qua lại. Ví dụ Lan (dựng khung, dùng Claude) và Long (runner, dùng DeepSeek): mỗi vòng hỏi đáp mất bốn lần copy và dán, và agent không biết câu nào do ai nói.

SpecGate bỏ vòng copy và dán đó bằng ba ý:

1. Trong workspace riêng, người dùng highlight đoạn đáng giá trong câu trả lời của agent, lưu lại, xem lại, và khi đã chắc mới gửi vào kênh nhóm, ghi rõ đó là lời của agent nào.
2. Agent của mỗi người tự đọc mọi tin mà chủ của nó đã nhắn trong kênh nhóm.
3. Tin của người khác chỉ đến được agent của mình khi mình highlight đoạn đó, và luôn kèm tên người đã nói.

Nhiệm vụ thứ hai: đưa số liệu thí nghiệm của bài báo ADOM vào đúng những chỗ nhóm làm việc (kênh chat, highlight, bảng ý tưởng, ngữ cảnh agent, bản tổng hợp), như bằng chứng để tranh luận và ra quyết định.

### 1.3. Phạm vi

Trong phạm vi:

- Tài khoản bằng Google hoặc GitHub, Trang chủ, thông báo ở thanh bên.
- Workspace riêng: API key, chat với agent, highlight riêng, ngữ cảnh nhóm, tóm tắt tin cũ, gửi kết quả vào kênh.
- Workspace chung: tạo, tham gia, kênh chat thời gian thực, highlight cho agent, bảng ý tưởng, tóm tắt kênh, bản tổng hợp, thành viên và cài đặt.
- Số liệu bài báo: nhập lượt chạy, chạy thử trên web, trang Số liệu, thẻ số liệu trong kênh, số liệu trong ngữ cảnh agent.
- Hành vi khi mất kết nối mạng.

Ngoài phạm vi: xem mục 8.

### 1.4. Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Workspace riêng | Không gian chỉ một người thấy. Mỗi tài khoản có đúng một, tạo sẵn khi đăng ký. Chứa các hội thoại với agent riêng và danh sách Highlight riêng |
| Workspace chung | Không gian nhiều người: đề bài, các kênh, bảng ý tưởng, bản tổng hợp, có thể có mục Số liệu. Không có agent của riêng nó |
| Chủ workspace | Người tạo workspace chung |
| Thành viên | Người đã được chủ duyệt vào workspace chung (kể cả chủ) |
| Agent riêng | Mô hình AI một người chọn sau khi nhập API key của mình. Mỗi người đúng một agent. Agent chat ở workspace riêng và agent mang tên người đó trong kênh là một |
| Tên agent | Cách gọi agent ở mọi nơi: "‹mô hình› của ‹tên trong workspace›", ví dụ "Claude của Lan" |
| Hội thoại | Một phiên chat với agent riêng, nằm trong workspace riêng |
| Ngữ cảnh nhóm | Thông tin của một workspace chung được gửi kèm mỗi câu hỏi trong hội thoại đã chọn workspace đó (xem UC06 phần A) |
| Khung "Agent đang đọc" | Khung bên phải hội thoại, hiện chính xác phần ngữ cảnh nhóm agent sẽ nhận |
| Highlight riêng | Đoạn người dùng bôi đen trong hội thoại với agent của mình, kèm màu và ghi chú tùy chọn; lưu vào danh sách Highlight riêng. Chỉ người tạo thấy |
| Bản tóm tắt hội thoại | Mục đặc biệt trong danh sách Highlight riêng: agent viết theo khung cố định để nhờ nhóm cùng lọc |
| Highlight cho agent | Một hoặc nhiều đoạn người dùng bôi đen trong tin của người khác ở kênh chung, để agent của mình đọc. Có nhãn _Quan trọng_ hoặc _Cần xem xét_. Chỉ người tạo thấy |
| Người nói | Tác giả của một đoạn: một người ("Lan"), agent của một người ("Claude của Lan"), hoặc một bản tóm tắt ("Bản tóm tắt do Claude của Lan viết (chưa lọc)") |
| Thẻ trích dẫn | Thẻ trong kênh hiển thị một highlight riêng đã gửi, ghi rõ người nói của đoạn gốc |
| Thẻ số liệu | Thẻ trong kênh do `/stats` hoặc `/task` tạo; là bản chụp số liệu tại lúc gửi |
| Bản chụp | Bản sao nguyên văn tại một thời điểm; sửa hay xóa nguồn sau này không làm đổi bản chụp |
| Trọn câu / trích một phần / đã chỉnh | Ba mức trung thực của một đoạn trích (xem BR-12) |
| Bảng ý tưởng | Bảng bốn cột Đề xuất, Đang bàn, Đã chốt, Đã loại, cộng một mục ghi chú |
| Bản tổng hợp | Văn bản dựng từ bảng ý tưởng, tải được dạng Markdown |
| Mã tham gia | Mã 7 ký tự chữ và số để xin vào một workspace chung |
| Tên trong workspace | Tên dùng ở mọi nơi trong một workspace, duy nhất trong workspace đó; mặc định là tên hiển thị của tài khoản |
| Vai trong nhóm | Một dòng tối đa 40 ký tự mỗi thành viên tự ghi về việc của mình, ví dụ "Dựng khung" |
| Lượt chạy | Một lần chạy thí nghiệm ADOM gắn vào workspace; có tình trạng hợp lệ hoặc không hợp lệ |
| Chạy thử | Lượt chạy nhỏ do chủ workspace chạy ngay trên web, luôn mang nhãn "chạy thử" |

---

## 2. Mô tả tổng quát

### 2.1. Hai không gian

| | Workspace riêng | Workspace chung |
| --- | --- | --- |
| Số lượng | Đúng một cho mỗi người | Không giới hạn số workspace tham gia; làm chủ tối đa khoảng 10 |
| Ai thấy | Chỉ chủ tài khoản | Các thành viên |
| Nội dung | Hội thoại với agent, Highlight riêng, Highlight cho agent, Key và mô hình | Đề bài, kênh, bảng ý tưởng, bản tổng hợp, thành viên, (Số liệu) |
| Agent | Agent riêng của người đó | Không có agent riêng của workspace; mỗi thành viên mang agent của mình |

### 2.2. Ngữ cảnh đi theo hai chiều

- **Chung sang riêng: tự động, chỉ để đọc.** Mỗi câu hỏi trong hội thoại đã chọn ngữ cảnh nhóm được gửi kèm thông tin của nhóm. Chỉ agent của người hỏi đọc phần này.
- **Riêng sang chung: thủ công.** Chỉ những gì người dùng chủ động gửi (highlight riêng hoặc bản tóm tắt hội thoại) mới rời workspace riêng. Không có nút đưa câu trả lời thẳng vào kênh.

Hai chiều nối thành một vòng: đoạn Lan gửi vào kênh là tin của Lan, nên tự quay lại ngữ cảnh của Lan; Long highlight đoạn đó, nên agent của Long đọc được kèm nhãn "Claude của Lan nói"; và cứ thế tiếp tục mà không ai phải copy hay dán.

### 2.3. Tác nhân

| Tác nhân | Loại | Mô tả |
| --- | --- | --- |
| Khách | Người | Chưa đăng nhập. Chỉ vào được trang đăng nhập |
| Người dùng | Người | Đã đăng nhập; có workspace riêng; có agent riêng khi đã nhập key |
| Thành viên | Người | Người dùng thuộc một workspace chung |
| Chủ workspace | Người | Thành viên đã tạo workspace; có thêm quyền quản lý |
| Người nhập số liệu | Người | Chủ workspace, hoặc người của nhóm ADOM được giao nhập lượt chạy |
| Nhà cung cấp danh tính | Hệ thống ngoài | Google, GitHub (OAuth) |
| Nhà cung cấp AI | Hệ thống ngoài | Anthropic, hoặc dịch vụ theo kiểu OpenAI (OpenAI, DeepSeek, OpenRouter, Groq, Ollama…) |
| Pipeline ADOM | Hệ thống ngoài | Chạy thí nghiệm cho chạy thử; nhận key và cấu hình do nhóm ADOM cài trên máy chủ |
| Hệ thống | Hệ thống | SpecGate Workspace |

Một người có thể là chủ ở workspace này và là thành viên ở workspace khác.

### 2.4. Ràng buộc

- Chỉ đăng nhập bằng Google hoặc GitHub; không có mật khẩu riêng, không có chế độ khách.
- Chỉ dùng API key; gói thuê bao (ChatGPT Plus, Claude Pro…) không dùng được.
- Hai bộ chuyển đổi mô hình: Anthropic và định dạng kiểu OpenAI.
- Mọi lời gọi mô hình đi qua máy chủ SpecGate, không gọi từ trình duyệt.
- Agent chỉ nhận chữ và trả lời bằng chữ: không tìm kiếm web, không đọc tệp hay ảnh, không chạy code.
- Cần kết nối Internet; không có chế độ ngoại tuyến.
- Giao diện mặc định tiếng Việt.

### 2.5. Giả định

- Người dùng tự có API key hợp lệ và tự chịu chi phí của key đó.
- Chạy thử thí nghiệm dùng key và cấu hình do nhóm ADOM cài trên máy chủ; chi phí do phía ADOM chịu.

### 2.6. Các giới hạn số lượng

| Giới hạn | Giá trị |
| --- | --- |
| Thời gian nhớ đăng nhập | 30 ngày, tính lại từ đầu mỗi lần quay lại |
| Workspace chung một người làm chủ | khoảng 10 |
| Highlight riêng mỗi người | khoảng 200 |
| Highlight cho agent mỗi người trong mỗi workspace | khoảng 30 |
| Tin của mình gửi nguyên văn trong ngữ cảnh nhóm | khoảng 50 tin gần nhất |
| Khối tin cũ giữ nguyên văn thay vì tóm tắt | dưới khoảng 5 tin |
| Số khối tóm tắt tin cũ | tối đa khoảng 31 |
| Lượt hỏi đáp đính kèm một bản tóm tắt hội thoại | 4 |
| Độ dài vai trong nhóm, tên trong workspace | 40 ký tự |
| Mã tham gia | 7 ký tự chữ và số, không dùng ký tự dễ nhầm (O và 0…) |
| Số tác vụ mỗi lần chạy thử | do máy chủ cấu hình |

Các con số "khoảng" là đề xuất, nhóm có thể điều chỉnh (mục 9).

---

## 3. Danh sách ca sử dụng

| Mã | Ca sử dụng | Tác nhân chính | Nhóm |
| --- | --- | --- | --- |
| UC01 | Đăng nhập, đăng ký và đăng xuất | Khách, Người dùng | Tài khoản |
| UC02 | Dùng Trang chủ và dấu báo ở thanh bên | Người dùng | Tài khoản |
| UC03 | Thiết lập API key và chọn mô hình | Người dùng | Workspace riêng |
| UC04 | Chat với agent riêng | Người dùng | Workspace riêng |
| UC05 | Highlight riêng | Người dùng | Workspace riêng |
| UC06 | Ngữ cảnh nhóm cho hội thoại | Thành viên | Ngữ cảnh |
| UC07 | Gửi highlight riêng vào kênh | Thành viên | Riêng sang chung |
| UC08 | Tóm tắt hội thoại cho nhóm | Thành viên | Riêng sang chung |
| UC09 | Tạo workspace chung | Người dùng | Workspace chung |
| UC10 | Xin tham gia workspace chung | Người dùng | Workspace chung |
| UC11 | Duyệt yêu cầu tham gia | Chủ workspace | Workspace chung |
| UC12 | Nhắn tin trong kênh | Thành viên | Kênh |
| UC13 | Highlight cho agent | Thành viên | Kênh |
| UC14 | Quản lý bảng ý tưởng | Thành viên, Chủ workspace | Bảng ý tưởng |
| UC15 | Tóm tắt kênh và bản tổng hợp | Chủ workspace | Tổng hợp |
| UC16 | Nhập lượt chạy số liệu | Người nhập số liệu | Số liệu |
| UC17 | Chạy thử thí nghiệm trên web | Chủ workspace | Số liệu |
| UC18 | Xem số liệu và gọi thẻ số liệu trong kênh | Thành viên | Số liệu |
| UC19 | Thành viên và cài đặt workspace | Thành viên, Chủ workspace | Thành viên |
| UC20 | Tiếp tục làm việc khi mạng chập chờn | Người dùng | Kết nối |

---

## 4. Đặc tả chi tiết từng ca sử dụng

Mỗi ca dùng cùng một mẫu: bảng thuộc tính, luồng chính, luồng thay thế (A), ngoại lệ (E) và quy tắc áp dụng. Ca gộp nhiều chức năng chia thành các phần A, B, C; mã luồng trong mỗi phần mang chữ của phần, ví dụ B.A1 là luồng thay thế A1 của phần B. Mã yêu cầu chức năng (FR) ở mục 5, quy tắc nghiệp vụ (BR) ở mục 6.

### 4.1. Tài khoản

#### UC01. Đăng nhập, đăng ký và đăng xuất

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Khách (đăng nhập, đăng ký); Người dùng (đăng xuất) |
| Tác nhân phụ | Google hoặc GitHub |
| Mục tiêu | Vào website bằng tài khoản Google/GitHub có sẵn, và rời phiên khi muốn |
| Tiền điều kiện | Chưa đăng nhập (phần A); đã đăng nhập (phần B) |
| Hậu điều kiện thành công | Có phiên 30 ngày; lần đầu thì có tài khoản và workspace riêng; đăng xuất thì phiên bị xóa |
| Hậu điều kiện thất bại | Không tạo tài khoản, không có phiên |
| Yêu cầu | FR-01 – FR-06 |

##### Phần A. Đăng ký hoặc đăng nhập bằng Google/GitHub

*Kích hoạt:* Khách mở bất kỳ trang nào của website  
*Tiền điều kiện:* Chưa đăng nhập

**Luồng chính**

1. Khách mở một trang bất kỳ. Hệ thống chuyển về trang đăng nhập và ghi nhớ trang định mở.
2. Trang đăng nhập có hai chế độ (Đăng nhập, Tạo tài khoản) và đúng hai nút: "Tiếp tục với Google", "Tiếp tục với GitHub".
3. Khách bấm một nút. Hệ thống chuyển sang trang chọn tài khoản của nhà cung cấp.
4. Khách chọn tài khoản và đồng ý chia sẻ tên, email (hoặc tên GitHub).
5. Nhà cung cấp trả danh tính về hệ thống.
6. Danh tính đã có tài khoản: hệ thống đăng nhập và đưa khách tới Trang chủ (UC02).
7. Phiên được lưu trên trình duyệt 30 ngày.

**Luồng thay thế**

- **A.A1. Lần đầu dùng danh tính này** (thay bước 6): hệ thống tạo tài khoản SpecGate kèm workspace riêng, rồi đưa người dùng tới màn nhập API key kèm lời chào (UC03).
- **A.A2. Có trang định mở** (thay bước 6): ví dụ đường dẫn tới một kênh bạn bè gửi; đăng nhập xong hệ thống đưa người dùng tới đúng trang đó thay vì Trang chủ.
- **A.A3. Quay lại trong 30 ngày**: người dùng mở website khi phiên còn hạn; hệ thống bỏ qua trang đăng nhập và tính lại 30 ngày từ đầu.
- **A.A4. Môi trường phát triển chưa cấu hình OAuth**: hệ thống hiện màn giả lập bước chọn tài khoản của nhà cung cấp (chọn tài khoản đã đăng ký, hoặc nhập tên GitHub/email và tên hiển thị để tạo mới). Màn này có nút "Hủy đăng ký" quay về trang đăng nhập. Màn giả lập không có khi đã cấu hình OAuth thật.

**Ngoại lệ**

- **A.E1. Khách hủy ở trang của nhà cung cấp**: quay về trang đăng nhập kèm thông báo "Bạn đã hủy đăng nhập", không tạo gì.
- **A.E2. Nhà cung cấp lỗi hoặc trả dữ liệu không hợp lệ**: quay về trang đăng nhập kèm thông báo lỗi dễ hiểu.
- **A.E3. Không kết nối được máy chủ SpecGate**: trang đăng nhập báo máy chủ tạm không phản hồi; không đăng xuất phiên đang có.

**Quy tắc:** BR-01, BR-02.

##### Phần B. Đăng xuất

*Kích hoạt:* Người dùng mở menu tài khoản (Trang chủ) hoặc khung người dùng (cuối cột bên)  
*Tiền điều kiện:* Đã đăng nhập

**Luồng chính**

1. Người dùng chọn "Đăng xuất".
2. Hệ thống xóa phiên và đưa người dùng về trang đăng nhập.

**Ngoại lệ**

- **B.E1. Mất kết nối khi đăng xuất**: phiên trên trình duyệt vẫn bị xóa; người dùng vẫn về trang đăng nhập.

#### UC02. Dùng Trang chủ và dấu báo ở thanh bên

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Mục tiêu | Tự chọn nơi muốn vào và biết workspace nào có việc cần làm |
| Tiền điều kiện | Đã đăng nhập |
| Kích hoạt | Đăng nhập xong (UC01 phần A), hoặc bấm logo SpecGate ở bất kỳ đâu |
| Hậu điều kiện thành công | Người dùng đi tới workspace riêng, một workspace chung, trang Khám phá, hoặc màn nhập key |
| Yêu cầu | FR-07 – FR-09 |

**Luồng chính**

1. Hệ thống hiện Trang chủ gồm: thanh workspace bên trái, hình minh họa robot kèm câu chào, menu tài khoản ở góc trên bên phải, và vài nút đi vào chức năng chính.
2. Người dùng bấm "Chat với agent của tôi" để mở workspace riêng, hoặc "Vào làm việc với nhóm" để mở workspace chung dùng gần nhất.

**Luồng thay thế**

- **A1. Chưa có API key**: nút thứ nhất là "Nhập API key để có agent", mở UC03.
- **A2. Chưa tham gia workspace chung nào**: nút thứ hai là "Tìm nhóm để tham gia", mở trang Khám phá; dưới các nút có lời gợi ý dùng "Nhập mã" hoặc "Tạo mới".
- **A3. Dùng thanh bên**: người dùng bấm vào một workspace trên thanh bên, hoặc các nút Tạo mới (UC09), Nhập mã (UC10 phần A), Khám phá (UC10 phần B).

**Dấu báo trên thanh bên** (có ở mọi trang, tự cập nhật không cần tải lại):

- chấm nhỏ, không kèm số, khi workspace có tin chưa đọc;
- chấm riêng, nổi hơn, khi có tin chưa đọc nhắc tên mình (`@`);
- với workspace mình làm chủ: con số yêu cầu tham gia đang chờ;
- trong một workspace, tên từng kênh cũng có chấm tin chưa đọc;
- dấu báo tự mất khi người dùng đọc tin hoặc xử lý xong yêu cầu;
- workspace đang chờ duyệt hiện mờ.

**Quy tắc:** Trang chủ không hiện số liệu, số tin mới, danh sách hội thoại hay danh sách ý tưởng (BR-03).

### 4.2. Workspace riêng

#### UC03. Thiết lập API key và chọn mô hình

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Tác nhân phụ | Nhà cung cấp AI |
| Mục tiêu | Có agent riêng để chat |
| Tiền điều kiện | Đã đăng nhập |
| Kích hoạt | Đăng ký lần đầu (UC01 A.A1), bấm ô "Agent của bạn" ở cột bên, hoặc mở "Key và mô hình" |
| Hậu điều kiện thành công | Key được lưu mã hóa; mô hình đã chọn là agent riêng; giao diện chỉ còn hiện 4 ký tự cuối của key |
| Hậu điều kiện thất bại | Key không được lưu |
| Yêu cầu | FR-10 – FR-14 |

**Luồng chính**

1. Người dùng chọn nhà cung cấp: Anthropic, hoặc "Kiểu OpenAI".
2. Với "Kiểu OpenAI", người dùng nhập thêm địa chỉ API của dịch vụ.
3. Người dùng dán API key và bấm "Kiểm và lưu key".
4. Hệ thống kiểm key ngay với nhà cung cấp.
5. Key dùng được: hệ thống lưu key đã mã hóa và lấy danh sách mô hình của key.
6. Người dùng chọn một mô hình. Mô hình này là agent riêng của người dùng.

**Luồng thay thế**

- **A1. Đổi mô hình**: người dùng chọn mô hình khác trong ô "Mô hình"; lựa chọn được lưu ngay.
- **A2. Đổi key**: người dùng bấm "Đổi key", form nhập key hiện ra, làm lại bước 1–6. Bấm "Hủy đổi key" để giữ key cũ.
- **A3. Xóa key**: người dùng bấm biểu tượng xóa, xác nhận trong hộp thoại; hệ thống xóa key. Người dùng không chat được cho tới khi nhập key mới; lịch sử hội thoại giữ nguyên.

**Ngoại lệ**

- **E1. Key sai, hết tiền, hoặc không kết nối được nhà cung cấp**: báo lỗi bằng một câu tiếng Việt dễ hiểu; không lưu key.
- **E2. Địa chỉ API không hợp lệ** (kiểu OpenAI): báo lỗi ở ô địa chỉ; không lưu key.

**Quy tắc:** BR-04, BR-05. Màn nhập key ghi rõ gói thuê bao không phải API key. Đổi key hay đổi mô hình không làm mất highlight riêng; các tin cũ trong kênh giữ tên mô hình lúc gửi.

#### UC04. Chat với agent riêng

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Tác nhân phụ | Nhà cung cấp AI |
| Mục tiêu | Hỏi agent, nhận câu trả lời có định dạng, thử câu trả lời khác và giữ danh sách hội thoại gọn gàng |
| Tiền điều kiện | Đã có key hợp lệ (UC03) |
| Hậu điều kiện thành công | Câu hỏi, câu trả lời và các phiên bản được lưu; chỉ chủ hội thoại xem được |
| Yêu cầu | FR-15 – FR-23 |

##### Phần A. Chat với agent riêng

*Kích hoạt:* Người dùng mở workspace riêng và gửi một câu hỏi  
*Tiền điều kiện:* Đã có key hợp lệ (UC03)

**Luồng chính**

1. Người dùng tạo hội thoại mới hoặc mở hội thoại cũ trong danh sách bên trái (mới nhất ở trên cùng).
2. Người dùng gõ câu hỏi và gửi (Enter gửi, Shift+Enter xuống dòng).
3. Câu hỏi hiện ngay và được lưu trước khi agent trả lời.
4. Hệ thống gửi cho mô hình, bằng key của người dùng: các lượt hỏi đáp trước đó (lượt gần nhất nếu hội thoại quá dài) và, nếu hội thoại có ngữ cảnh nhóm, phần ngữ cảnh nhóm (UC06 phần A).
5. Câu trả lời hiện dần từng chữ, có định dạng: chữ đậm, tiêu đề, danh sách, bảng, khối code.
6. Câu trả lời được lưu. Dưới câu trả lời có nút "Chép" và "Tạo lại" (UC04 phần B); mỗi khối code có nút chép riêng.

**Luồng thay thế**

- **A.A1. Hội thoại mới**: tên hội thoại tự lấy từ câu hỏi đầu tiên; trước câu hỏi đầu, người dùng có thể chọn ngữ cảnh nhóm (UC06 phần A).
- **A.A2. Dừng**: trong lúc agent đang trả lời, người dùng bấm "Dừng"; phần đã viết được giữ lại và ghi "Đã dừng".

**Ngoại lệ**

- **A.E1. Nhà cung cấp lỗi giữa chừng** (key hết tiền, quá giới hạn, mất kết nối tới nhà cung cấp): câu hỏi vẫn còn; câu báo lỗi hiện ngay trong hội thoại thay cho câu trả lời; lượt lỗi không được gửi lại cho agent ở các lần hỏi sau.
- **A.E2. Chưa có key**: hệ thống đưa người dùng tới màn nhập key (UC03).
- **A.E3. Mất mạng khi đang trả lời**: xem UC20.

**Quy tắc:** BR-06, BR-07. Agent nhớ trong phạm vi một hội thoại; hai hội thoại của cùng một người không thấy nhau.

##### Phần B. Tạo lại câu trả lời và chuyển phiên bản

*Kích hoạt:* Người dùng bấm "Tạo lại" dưới câu trả lời  
*Tiền điều kiện:* Hội thoại có ít nhất một câu trả lời

**Luồng chính**

1. Người dùng bấm "Tạo lại".
2. Hệ thống gọi lại mô hình cho cùng câu hỏi; câu trả lời mới hiện dần.
3. Câu trả lời cũ được giữ thành một phiên bản. Dưới câu trả lời có nút "‹ 1/2 ›" để chuyển phiên bản.
4. Khi người dùng hỏi tiếp, agent chỉ đọc phiên bản đang hiển thị.

**Luồng thay thế**

- **B.A1. Mở highlight của phiên bản cũ**: bấm vào một highlight riêng gắn với phiên bản cũ thì hệ thống mở đúng phiên bản đó, đúng chỗ đã đánh dấu.

**Ngoại lệ**

- **B.E1. Lỗi nhà cung cấp**: như UC04 A.E1; phiên bản cũ không bị ảnh hưởng.

**Quy tắc:** Vì không có gì bị mất, hệ thống không hỏi giữ hay xóa highlight khi tạo lại.

##### Phần C. Quản lý hội thoại

*Kích hoạt:* Người dùng bấm biểu tượng sửa tên hoặc biểu tượng xóa ở đầu hội thoại  
*Tiền điều kiện:* Có ít nhất một hội thoại

**Luồng chính (đổi tên)**

1. Người dùng bấm sửa tên, nhập tên mới (tối đa 80 ký tự), bấm Lưu.
2. Danh sách hội thoại cập nhật tên.

**Luồng thay thế (xóa)**

- **C.A1. Hội thoại không có highlight riêng**: hội thoại bị xóa ngay.
- **C.A2. Hội thoại có highlight riêng**: hệ thống hỏi "Hội thoại này có N highlight. Giữ lại hay xóa luôn?", mặc định là giữ lại.
  - Giữ lại: highlight ghi thêm "hội thoại gốc đã bị xóa" và không mở lại được đúng chỗ.
  - Xóa luôn: các highlight riêng của hội thoại bị xóa cùng.

**Ngoại lệ**

- **C.E1. Ai đó đoán đường dẫn hội thoại của người khác**: hệ thống chỉ báo "không tìm thấy".

**Quy tắc:** Những gì đã gửi vào kênh vẫn còn vì là bản chụp (BR-13).

#### UC05. Highlight riêng

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Mục tiêu | Giữ lại những ý đáng giá trong hội thoại, xem lại, chỉnh và dọn dẹp chúng trước khi quyết định gửi cho nhóm |
| Tiền điều kiện | Có ít nhất một hội thoại có lượt đã lưu (phần A); đã đăng nhập (phần B) |
| Hậu điều kiện thành công | Danh sách Highlight riêng phản ánh đúng thay đổi; các thẻ đã gửi vào kênh không đổi |
| Yêu cầu | FR-24 – FR-30 |

##### Phần A. Tạo highlight riêng

*Kích hoạt:* Người dùng bôi đen một đoạn trong câu trả lời của agent hoặc câu hỏi của chính mình  
*Tiền điều kiện:* Đang mở một hội thoại có ít nhất một lượt đã lưu

**Luồng chính**

1. Người dùng bôi đen một đoạn trong một lượt.
2. Một thanh nhỏ hiện cạnh đoạn đã chọn, có các màu (vàng, xanh lá, xanh dương, hồng, tím).
3. Người dùng chọn màu; nếu muốn, ghi một dòng ghi chú ngắn.
4. Người dùng bấm Lưu.
5. Đoạn được tô màu ngay trong hội thoại và lưu vào danh sách Highlight riêng, kèm: nguyên văn đoạn, người nói ("Claude của Lan" hoặc "Lan"), tên mô hình lúc tạo, hội thoại và lượt gốc, ngữ cảnh nhóm tại lúc agent viết (nếu có).
6. Hệ thống báo "Đã lưu vào Highlight riêng. Chưa có gì được gửi vào nhóm."

**Luồng thay thế**

- **A.A1. Hủy**: người dùng bấm Hủy hoặc bấm ra ngoài; không lưu gì.

**Ngoại lệ**

- **A.E1. Vùng chọn trải qua hai lượt hoặc nằm trong lượt lỗi, lượt đang viết**: thanh lưu không hiện.
- **A.E2. Đã đủ khoảng 200 highlight riêng**: hệ thống không lưu và nhắc dọn bớt (UC05 phần B).

**Quy tắc:** BR-08, BR-09. Màu do người dùng tự đặt nghĩa, không đi theo khi gửi vào nhóm. Highlight riêng không gửi cho agent nên không tốn tiền key.

##### Phần B. Quản lý danh sách Highlight riêng

*Kích hoạt:* Người dùng mở "Highlight riêng" trong workspace riêng  
*Tiền điều kiện:* Đã đăng nhập

**Luồng chính**

1. Hệ thống hiện mọi highlight riêng theo thời gian, mỗi mục có: màu, người nói, mô hình, hội thoại gốc, thời điểm, ghi chú, các lần đã gửi (workspace, kênh, lúc nào), và nhãn "viết khi đọc ngữ cảnh ‹tên nhóm›" nếu có.
2. Người dùng lọc theo màu, hội thoại, loại (đoạn đã lọc, bản tóm tắt), đã gửi hay chưa, hoặc gõ chữ để tìm.
3. Người dùng bấm vào một highlight để mở lại đúng hội thoại, đúng chỗ đã đánh dấu.

**Luồng thay thế**

- **B.A1. Sửa**: người dùng sửa nội dung, đổi màu, sửa ghi chú rồi lưu. Nếu sửa chữ của agent (không chỉ cắt bớt), hệ thống báo trước rằng thẻ khi gửi sẽ ghi "(‹tên› đã chỉnh)".
- **B.A2. Xóa một mục**: mục bị xóa; thẻ đã gửi vào kênh vẫn còn.
- **B.A3. Dọn dẹp**: người dùng mở "Dọn dẹp", chọn điều kiện (màu, hội thoại, chỉ mục đã gửi vào nhóm) và xác nhận; hệ thống xóa các mục khớp và báo số đã xóa, số còn lại.
- **B.A4. Gửi**: người dùng chọn một hoặc vài mục rồi bấm "Gửi vào nhóm" (UC07 phần A).
- **B.A5. Đính kèm lượt gốc** (chỉ với bản tóm tắt hội thoại): chọn tối đa 4 lượt hỏi đáp gốc (UC08).

**Ngoại lệ**

- **B.E1. Gần đủ giới hạn**: danh sách hiện lời nhắc "Bạn đã dùng N/200 highlight riêng".

**Quy tắc:** BR-09. Highlight riêng chỉ bị xóa khi chính người dùng xóa; hệ thống không bao giờ tự xóa.

### 4.3. Ngữ cảnh nhóm

#### UC06. Ngữ cảnh nhóm cho hội thoại

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên |
| Tác nhân phụ | Nhà cung cấp AI (khi tóm tắt tin cũ) |
| Mục tiêu | Agent biết nhóm đang bàn gì khi trả lời, kể cả khi tin của mình đã quá nhiều |
| Tiền điều kiện | Đang mở hội thoại; là thành viên của ít nhất một workspace chung |
| Hậu điều kiện thành công | Mỗi câu hỏi gửi kèm ngữ cảnh mới nhất của workspace đã chọn; khung "Agent đang đọc" hiện đúng phần này |
| Yêu cầu | FR-31 – FR-41 |

##### Phần A. Chọn ngữ cảnh nhóm cho hội thoại

*Kích hoạt:* Người dùng chọn một workspace ở ô "Ngữ cảnh nhóm" (khi tạo hội thoại mới hoặc bất cứ lúc nào sau đó)  
*Tiền điều kiện:* Đang mở hội thoại; là thành viên của ít nhất một workspace chung

**Luồng chính**

1. Người dùng chọn một workspace chung ở ô "Ngữ cảnh nhóm".
2. Hệ thống lưu lựa chọn ngay. Trong danh sách hội thoại, hội thoại này có biểu tượng nhóm.
3. Khung "Agent đang đọc" hiện bên phải hội thoại, gồm đúng những gì agent sẽ nhận:
   - đề bài;
   - thành viên: tên trong workspace, ai là chủ, vai trong nhóm, agent đang dùng;
   - ý đã chốt và ý đã loại, kèm lý do; lời dặn không đề xuất lại ý đã loại;
   - một dòng thời gian chung gồm mọi tin của mình trong các kênh của workspace (kể cả thẻ trích dẫn và bản tóm tắt hội thoại mình đã gửi) và các highlight cho agent của mình; mỗi mục ghi giờ, kênh, người nói, đang trả lời tin của ai (nếu có);
   - với mỗi highlight: người nói, nhãn, ghi chú của mình, lời nhắc "chưa phải quyết định của nhóm", và lời nhắc lượt chạy (nếu đoạn lấy từ số liệu đã bị đánh dấu không hợp lệ hoặc đã có lượt mới hơn);
   - nếu workspace có số liệu: tên lượt chạy, tình trạng hợp lệ, sáu tiêu chí mỗi tiêu chí một dòng.
4. Ở câu hỏi tiếp theo, hệ thống lấy ngữ cảnh mới nhất và gửi kèm.

**Luồng thay thế**

- **A.A1. Bỏ ngữ cảnh**: chọn "Không gắn"; khung "Agent đang đọc" biến mất và agent chat như bình thường.
- **A.A2. Đổi sang workspace khác**: mỗi hội thoại chỉ lấy ngữ cảnh từ một workspace tại một thời điểm. Các câu trả lời đã có giữ nguyên ngữ cảnh lúc chúng được viết.
- **A.A3. Sửa vai trong nhóm** ngay trong khung (UC19 A.A2).
- **A.A4. Bỏ một highlight** ngay trong khung: highlight bị bỏ khỏi danh sách Highlight cho agent và khỏi ngữ cảnh.
- **A.A5. Tin của mình vượt giới hạn**: khung ghi "N tin cũ của bạn đang không được gửi cho agent", kèm nút "Tóm tắt tin cũ" (UC06 phần B).
- **A.A6. Màn hình hẹp**: khung "Agent đang đọc" thành ngăn kéo, mở bằng nút ở mép phải.

**Ngoại lệ**

- **A.E1. Không còn là thành viên của workspace đã chọn**: hội thoại vẫn còn nhưng agent không nhận thông tin nhóm nữa.

**Quy tắc:** BR-10, BR-11, BR-14. Ngoài các đoạn đã highlight, agent không đọc tin nào khác của người khác; việc ai đó nhắc tên mình cũng không làm tin đó lọt vào. Bản tóm tắt kênh (`/summarize`) không tính là tin của mình, kể cả khi mình là chủ. Agent được dặn nói rõ mình dựa vào ý của ai, và không dùng số liệu của lượt chạy không hợp lệ làm kết luận.

##### Phần B. Tóm tắt tin cũ của tôi

*Kích hoạt:* Người dùng bấm "Tóm tắt tin cũ" trong khung "Agent đang đọc"  
*Tiền điều kiện:* Hội thoại có ngữ cảnh nhóm; tin của mình vượt khoảng 50 tin

**Luồng chính**

1. Trước khi chạy, hệ thống cho biết sẽ tóm tắt bao nhiêu tin, thành mấy khối, bao nhiêu khối cần gọi agent và bao nhiêu tin được giữ nguyên văn.
2. Người dùng bấm "Tóm tắt tin cũ".
3. Hệ thống chia các tin cũ thành nhiều khối, cắt đúng tại mốc giờ của từng highlight xen giữa.
4. Khối dưới khoảng 5 tin được giữ nguyên văn; các khối còn lại được gửi chung trong **một lần gọi** agent, có đánh dấu ranh giới khối, bằng key của người dùng.
5. Agent trả bản tóm tắt theo đúng từng khối. Mỗi khối ghi khoảng thời gian, ví dụ "Tóm tắt tin của tôi, từ 10/11 tới 12/11", và nằm đúng chỗ trên dòng thời gian.
6. Khung "Agent đang đọc" hiện bản tóm tắt; các câu hỏi sau gửi kèm bản này.

**Luồng thay thế**

- **B.A1. Lại có tin cũ vượt giới hạn**: khung lại báo số tin chưa được tóm tắt; người dùng tự quyết có bấm tiếp hay không.
- **B.A2. Chia sẻ bản tóm tắt**: người dùng bấm "Lưu vào Highlight riêng để chia sẻ", rồi gửi như mọi highlight riêng (UC07 phần A).

**Ngoại lệ**

- **B.E1. Key lỗi khi tóm tắt**: báo lỗi bằng câu dễ hiểu; giữ bản tóm tắt cũ.

**Quy tắc:** Hệ thống không bao giờ tự tóm tắt khi người dùng chưa bấm (vì tốn tiền key). Highlight không bao giờ bị cắt hay bị tóm tắt. Số khối tối đa khoảng 31. Agent không tự đưa bản tóm tắt vào workspace chung.

### 4.4. Đưa kết quả từ workspace riêng vào kênh

#### UC07. Gửi highlight riêng vào kênh

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên |
| Mục tiêu | Đưa ý đã lọc từ workspace riêng vào kênh nhóm, ghi rõ người nói, mà không phải copy và dán |
| Tiền điều kiện | Có ít nhất một highlight riêng; là thành viên của ít nhất một workspace chung |
| Hậu điều kiện thành công | Kênh có một tin dưới tên người dùng, mỗi highlight là một thẻ trích dẫn; danh sách Highlight riêng ghi lại lần gửi |
| Yêu cầu | FR-42 – FR-49 |

##### Phần A. Gửi highlight riêng vào kênh từ danh sách

*Kích hoạt:* Trong danh sách Highlight riêng, người dùng chọn một hoặc vài mục rồi bấm "Gửi vào nhóm" (hoặc nút "Gửi" trên một mục)  
*Tiền điều kiện:* Có ít nhất một highlight riêng; là thành viên của ít nhất một workspace chung

**Luồng chính**

1. Hộp thoại gửi mở ra.
2. Người dùng chọn workspace chung và kênh.
3. Người dùng viết thêm lời của mình (tùy chọn).
4. Với mỗi highlight, hộp thoại hiện nội dung sẽ gửi (sửa được) và nhãn người nói sẽ hiện: "Claude của Lan nói", "Claude của Lan nói (trích một phần)", hoặc "Claude của Lan nói (Lan đã chỉnh)" (BR-12).
5. Người dùng bấm Gửi.
6. Kênh hiện một tin dưới tên người dùng, kèm các thẻ trích dẫn ghi người nói của đoạn gốc; thẻ có dấu "…" ở chỗ bị cắt.
7. Hộp thoại báo đã gửi, kèm nút mở kênh.

**Luồng thay thế**

- **A.A1. Đã từng gửi vào đúng kênh này**: hộp thoại nhắc trước; nếu người dùng vẫn gửi, hệ thống yêu cầu xác nhận "Vẫn gửi lại".
- **A.A2. Gửi sang workspace khác với ngữ cảnh lúc agent viết**: hộp thoại cảnh báo "Đoạn này được viết khi agent đang đọc thông tin của nhóm ‹A›, và có thể chứa thông tin của nhóm đó. Bạn vẫn muốn gửi sang nhóm này?"; phải xác nhận mới gửi.

**Ngoại lệ**

- **A.E1. Không còn là thành viên của workspace đích**: báo lỗi, không gửi.
- **A.E2. Nội dung trống**: không cho gửi.

**Quy tắc:** BR-12, BR-13, BR-15. Hội thoại chứa highlight không cần chọn ngữ cảnh nhóm. Thẻ là bản chụp; sửa hay xóa highlight sau đó không đổi thẻ. Tin giữ tên mô hình lúc gửi.

##### Phần B. Chèn highlight riêng vào tin bằng `@`

*Kích hoạt:* Người dùng gõ `@` và chọn mục "Highlight của tôi", hoặc bấm nút chèn highlight ở ô soạn  
*Tiền điều kiện:* Đang soạn tin trong một kênh; có ít nhất một highlight riêng

**Luồng chính**

1. Danh sách gợi ý `@` có mục "Highlight của tôi" đứng đầu, bên cạnh tên các thành viên.
2. Người dùng chọn mục đó; bảng chọn highlight hiện trên ô soạn.
3. Người dùng lọc theo màu hoặc gõ chữ để tìm, rồi chọn một highlight. Mục đã gửi vào kênh này có ghi "đã gửi vào kênh này".
4. Highlight được chèn vào tin đang soạn thành thẻ trích dẫn, hiện nhãn người nói.
5. Người dùng viết thêm lời của mình xung quanh và gửi.

**Luồng thay thế**

- **B.A1. Bỏ thẻ** trước khi gửi bằng nút bỏ trên thẻ.
- **B.A2. Chèn nhiều highlight** vào cùng một tin.
- **B.A3. Đã từng gửi vào kênh này**: như UC07 A.A1, ô soạn hỏi "Vẫn gửi".
- **B.A4. Ngữ cảnh khác nhóm**: như UC07 A.A2, ô soạn hỏi xác nhận.

**Quy tắc:** như UC07 phần A.

#### UC08. Tóm tắt hội thoại cho nhóm

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên |
| Tác nhân phụ | Nhà cung cấp AI |
| Mục tiêu | Nhờ cả nhóm cùng lọc khi mình chưa phân định được ý nào đáng giữ |
| Tiền điều kiện | Hội thoại có ít nhất một câu trả lời; đã có key |
| Kích hoạt | Người dùng bấm "Tóm tắt cho nhóm" ở đầu hội thoại |
| Hậu điều kiện thành công | Bản tóm tắt được lưu vào danh sách Highlight riêng như một mục "bản tóm tắt", chưa gửi đi |
| Yêu cầu | FR-50 – FR-53 |

**Luồng chính**

1. Agent của người dùng, bằng key của người dùng, viết bản tóm tắt theo khung cố định:
   - vấn đề đang xét;
   - các hướng đã thử và kết quả;
   - những điểm còn chưa chắc;
   - những câu hỏi muốn nhóm trả lời.
2. Mỗi ý trong khung bắt buộc ghi rõ của ai, ví dụ "[Lan] muốn…", "[Claude] đề xuất…".
3. Bản tóm tắt được lưu vào danh sách Highlight riêng, ghi "bản tóm tắt". Hệ thống báo đã lưu, kèm nút mở danh sách.
4. Người dùng xem lại, sửa hoặc xóa bớt (UC05 phần B).
5. Người dùng đính kèm tối đa 4 lượt hỏi đáp gốc (UC05 B.A5) nếu muốn.
6. Người dùng gửi bản tóm tắt như một highlight riêng (UC07).
7. Trong kênh, bản tóm tắt là một thẻ riêng, ghi "Tóm tắt hội thoại của Lan, do Claude của Lan viết, chưa được lọc"; các lượt gốc nằm thu gọn trong thẻ.

**Ngoại lệ**

- **E1. Key lỗi**: báo lỗi dễ hiểu; không lưu gì.

**Quy tắc:** BR-16. Không có cách gửi nguyên văn cả hội thoại. Khi ai đó highlight một đoạn trong phần tóm tắt, người nói là "Bản tóm tắt do Claude của Lan viết (chưa lọc)"; đoạn lấy từ lượt gốc giữ người nói của lượt đó. Cảnh báo gửi sang nhóm khác (UC07 A.A2) áp dụng như với highlight riêng.

### 4.5. Workspace chung

#### UC09. Tạo workspace chung

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Mục tiêu | Có nơi để cả nhóm làm việc trên một đề bài |
| Tiền điều kiện | Đã đăng nhập (không bắt buộc có API key) |
| Kích hoạt | Người dùng bấm "Tạo mới" trên thanh bên |
| Hậu điều kiện thành công | Workspace mới có kênh "chung" và một mã tham gia; người tạo là chủ |
| Yêu cầu | FR-54 – FR-56 |

**Luồng chính**

1. Hộp thoại tạo workspace mở ra.
2. Người dùng nhập tên, đề bài, và chọn chế độ hiển thị: "Ẩn, không ai tìm thấy" hoặc "Ai cũng tìm thấy, vào phải xin".
3. Người dùng bấm "Tạo workspace".
4. Hệ thống tạo workspace kèm kênh "chung" và mã tham gia, rồi mở kênh "chung".

**Ngoại lệ**

- **E1. Thiếu tên hoặc đề bài**: không cho tạo, chỉ rõ phần còn thiếu.
- **E2. Tên trùng một workspace khác do chính người dùng làm chủ**: không cho tạo.
- **E3. Đã làm chủ khoảng 10 workspace**: không cho tạo, báo đã đạt giới hạn.

**Quy tắc:** BR-17. Workspace chung không có agent riêng và không có agent "trọng tài" tự động đọc kênh.

#### UC10. Xin tham gia workspace chung

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Mục tiêu | Vào một workspace chung bằng mã được gửi, hoặc tìm và xin vào qua trang Khám phá |
| Tiền điều kiện | Đã đăng nhập; chưa là thành viên workspace đó |
| Hậu điều kiện thành công | Có yêu cầu tham gia đang chờ; người dùng ở trang "Đang chờ duyệt" và được chuyển vào khi chủ duyệt |
| Yêu cầu | FR-57 – FR-64 |

##### Phần A. Xin tham gia bằng mã

*Kích hoạt:* Người dùng bấm "Nhập mã" (biểu tượng chìa khóa) trên thanh bên  
*Tiền điều kiện:* Đã đăng nhập; chưa là thành viên workspace đó

**Luồng chính**

1. Một thành viên mở "Chia sẻ mã tham gia", chép mã 7 ký tự và gửi cho người dùng qua bất kỳ kênh nào ngoài hệ thống.
2. Người dùng mở hộp thoại nhập mã và nhập mã. Chữ thường, dấu cách, dấu gạch nối đều được chấp nhận.
3. Hệ thống tạo yêu cầu tham gia và đưa người dùng tới trang "Đang chờ duyệt".
4. Trên thanh bên, workspace đang chờ hiện mờ.
5. Khi chủ duyệt (UC11), trang chờ tự chuyển người dùng vào workspace, không cần tải lại.

**Luồng thay thế**

- **A.A1. Hủy yêu cầu**: ở trang chờ, người dùng bấm "Hủy yêu cầu".
- **A.A2. Đã có yêu cầu đang chờ cho workspace này**: yêu cầu cũ được cập nhật, không tạo yêu cầu mới.
- **A.A3. Đã là thành viên**: hệ thống mở thẳng workspace đó.

**Ngoại lệ**

- **A.E1. Mã sai, sai định dạng, hoặc chủ đã đổi mã**: báo mã không hợp lệ, gợi ý xin mã mới.
- **A.E2. Bị từ chối**: trang chờ hiện "Yêu cầu bị từ chối", kèm nút về workspace riêng và tìm nhóm khác.

**Quy tắc:** BR-18.

##### Phần B. Xin tham gia qua trang Khám phá

*Kích hoạt:* Người dùng bấm "Khám phá" trên thanh bên, hoặc mở một workspace mình chưa là thành viên  
*Tiền điều kiện:* Đã đăng nhập

**Luồng chính**

1. Trang Khám phá liệt kê các workspace chung để chế độ "ai cũng tìm thấy".
2. Người dùng tìm theo tên hoặc đề bài.
3. Mỗi workspace cho biết: đề bài, chủ, số thành viên, và quan hệ của người dùng (chưa tham gia, đang chờ duyệt, đã là thành viên).
4. Người dùng chọn một workspace, viết lời nhắn cho chủ và bấm "Gửi yêu cầu".
5. Hệ thống tạo yêu cầu và đưa người dùng tới trang "Đang chờ duyệt" (như UC10 phần A bước 3–5).

**Luồng thay thế**

- **B.A1. Mở đường dẫn tới workspace chưa là thành viên**: hệ thống đưa người dùng tới Khám phá và chọn sẵn workspace đó.
- **B.A2. Đang chờ duyệt**: người dùng sửa được lời nhắn của yêu cầu.
- **B.A3. Đã là thành viên**: nút "Mở workspace".

**Ngoại lệ**

- **B.E1. Workspace để chế độ ẩn**: không hiện ở Khám phá; muốn vào phải có mã.

**Quy tắc:** BR-18.

#### UC11. Duyệt yêu cầu tham gia

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Chủ workspace |
| Mục tiêu | Quyết định ai được vào nhóm |
| Tiền điều kiện | Là chủ workspace |
| Kích hoạt | Chủ mở "Yêu cầu tham gia" (thanh bên có số yêu cầu đang chờ) |
| Hậu điều kiện thành công | Người được duyệt thành thành viên; yêu cầu đã xử lý vào lịch sử |
| Yêu cầu | FR-65 – FR-68 |

**Luồng chính**

1. Trang "Yêu cầu tham gia" hiện các yêu cầu đang chờ và tự cập nhật khi có yêu cầu mới.
2. Mỗi yêu cầu cho biết: ai xin, xin bằng mã hay qua Khám phá, lời nhắn (nếu có), thời điểm.
3. Chủ bấm "Duyệt" hoặc "Từ chối".
4. Duyệt: người xin trở thành thành viên, được gán một màu ảnh đại diện chưa ai dùng trong workspace.
5. Yêu cầu chuyển vào phần lịch sử đã xử lý, ghi kết quả và người xử lý.

**Luồng thay thế**

- **A1. Tên hiển thị trùng tên một thành viên** (kể cả người đã rời): người mới được tạm đặt tên kèm số (ví dụ "Lan 2") và được yêu cầu chọn biệt danh khi vào workspace (UC19 A.A1).
- **A2. Người đã từng rời xin vào lại**: được lấy lại tên cũ; tin cũ của họ hiện lại như bình thường.

**Ngoại lệ**

- **E1. Yêu cầu đã được xử lý hoặc đã bị hủy**: không xử lý lại; danh sách làm mới hiện đúng trạng thái.
- **E2. Người không phải chủ mở trang**: hệ thống đưa về kênh "chung".

**Quy tắc:** BR-18, BR-25.

### 4.6. Kênh

#### UC12. Nhắn tin trong kênh

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên |
| Mục tiêu | Trao đổi với nhóm theo thời gian thực |
| Tiền điều kiện | Là thành viên; đang mở một kênh |
| Kích hoạt | Thành viên soạn và gửi tin |
| Hậu điều kiện thành công | Tin hiện ngay cho mọi người đang mở kênh; tin vào ngữ cảnh agent của người gửi |
| Yêu cầu | FR-69 – FR-76 |

**Luồng chính**

1. Thành viên soạn tin. Gõ `@` thì hệ thống gợi ý tên thành viên và mục "Highlight của tôi" (UC07 phần B); gõ `/` thì gợi ý lệnh. Chọn gợi ý bằng chuột hoặc bàn phím (mũi tên, Enter, Tab, Esc).
2. Thành viên gửi tin.
3. Tin hiện ngay cho mọi người đang mở kênh, không cần tải lại.
4. Nếu tin bắt đầu bằng một lệnh, hệ thống thực hiện lệnh (bảng dưới).

**Các lệnh**

| Lệnh | Tác dụng | Ai dùng được | Ca |
| --- | --- | --- | --- |
| `/idea ‹nội dung›` | Ghi một ý lên cột Đề xuất | Mọi thành viên | UC14 phần A |
| `/note ‹nội dung›` | Thêm ghi chú lên bảng | Mọi thành viên | UC14 phần A |
| `/pin` | Khi đang trả lời một tin: đưa tin đó lên bảng | Mọi thành viên | UC14 phần A |
| `/decide #‹số› chốt\|loại ‹lý do›` | Chốt hoặc loại một ý | Theo BR-21 | UC14 phần C |
| `/stats` | Hiện thẻ số liệu | Mọi thành viên (workspace có số liệu) | UC18 |
| `/task ‹mã tác vụ›` | Hiện thẻ kết quả một tác vụ | Mọi thành viên (workspace có số liệu) | UC18 |
| `/summarize` | Tóm tắt kênh | Chủ workspace | UC15 phần A |
| `/brief` | Dựng bản tổng hợp | Chủ workspace | UC15 phần B |
| `/help` | Xem danh sách lệnh | Mọi thành viên | UC12 |

**Hiển thị trong kênh**

- Bốn loại tin phân biệt được bằng mắt: tin của người; thẻ trích dẫn (ghi người nói); thẻ đặc biệt (tóm tắt hội thoại, số liệu); tin hệ thống.
- Mỗi thành viên có ảnh đại diện màu riêng, không trùng trong workspace. Thẻ trích dẫn lời agent mang màu và chữ cái đầu của chủ agent.
- Rê chuột vào tên thấy tài khoản gốc (tên GitHub, hoặc email đã che bớt).
- Người đã rời hiện là "‹tên› (đã rời)".
- Cột bên liệt kê agent của từng thành viên và bảng ý tưởng thu gọn.

**Luồng thay thế**

- **A1. Kết nối chập chờn**: kênh tự kết nối lại và hiện bù những tin đã lỡ (UC20).
- **A2. Lệnh của thành viên không có quyền**: hệ thống trả tin rằng đây là quyền của chủ workspace.

**Ngoại lệ**

- **E1. Tin trống**: không gửi.
- **E2. Lệnh sai cú pháp**: hệ thống trả tin hướng dẫn cú pháp đúng.

**Quy tắc:** BR-19, BR-20. Không agent nào tự trả lời trong kênh; nhắc tên người hay agent không làm agent nào lên tiếng.

#### UC13. Highlight cho agent

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên |
| Mục tiêu | Cho agent của mình đọc những đoạn mình chọn từ tin của người khác, kèm người nói |
| Tiền điều kiện | Là thành viên; đang mở một kênh |
| Kích hoạt | Thành viên bôi đen một hoặc nhiều đoạn trong kênh |
| Hậu điều kiện thành công | Highlight được lưu; có vệt phấn trong kênh (chỉ mình thấy); có trong ngữ cảnh mọi hội thoại chọn workspace này |
| Yêu cầu | FR-77 – FR-84 |

**Luồng chính**

1. Thành viên bôi đen trong tin của người khác, trong thẻ trích dẫn hay thẻ tóm tắt của người khác, hoặc trong thẻ số liệu. Vùng chọn có thể trải qua nhiều tin liền nhau.
2. Vùng chọn tự bắt theo loại nội dung: trọn từ (đoạn văn, danh sách), trọn dòng (khối code), trọn ô (bảng), trọn dòng tiêu chí (thẻ số liệu).
3. Nút "Highlight cho agent của tôi" hiện cạnh vùng chọn. Thành viên bấm nút.
4. Hộp thoại hiện từng đoạn, mỗi đoạn kèm người nói ("Long", "DeepSeek của Long", "Bản tóm tắt do DeepSeek của Long viết (chưa lọc)", "Thẻ số liệu lượt ‹tên›").
5. Thành viên chỉ được thu hẹp hai đầu hoặc bỏ bớt đoạn; không được sửa chữ. Hộp thoại hiện trước chính xác câu agent sẽ đọc, kèm dấu "…" và ghi chú "trích một phần" nếu cắt giữa câu.
6. Thành viên chọn nhãn _Quan trọng_ hoặc _Cần xem xét_, và ghi "Ghi chú của tôi" nếu muốn (tách riêng khỏi lời người nói).
7. Thành viên bấm "Lưu highlight".
8. Hệ thống báo đã lưu; đoạn có vệt phấn vàng nhạt trong kênh; highlight vào danh sách "Highlight cho agent" (theo từng workspace) và vào ngữ cảnh agent.

**Luồng thay thế**

- **A1. Vùng chọn chỉ gồm tin của chính mình**: không có nút lưu; hệ thống nhắc "Tin của bạn đã tự vào ngữ cảnh agent của bạn".
- **A2. Vùng chọn có lẫn tin của mình**: phần đó bị bỏ ra kèm lời nhắc "đã tự vào ngữ cảnh"; phần còn lại vẫn được lưu.
- **A3. Sửa nhãn hoặc ghi chú** sau này trong danh sách "Highlight cho agent".
- **A4. Bỏ highlight** trong danh sách "Highlight cho agent" hoặc trong khung "Agent đang đọc".

**Ngoại lệ**

- **E1. Thành viên sửa chữ ở giữa đoạn**: hộp thoại báo chỉ được thu hẹp hai đầu; nút lưu bị khóa. Muốn bỏ một vế ở giữa thì bôi đen lại thành hai đoạn riêng.
- **E2. Đã đủ khoảng 30 highlight trong workspace này**: không lưu; hệ thống nhắc tự bỏ bớt trước. Hệ thống không tự xóa highlight cũ.

**Quy tắc:** BR-11, BR-12, BR-22, BR-28. Mỗi đoạn trong một highlight giữ người nói và tin gốc riêng; agent không gộp lời hai người. Highlight lưu nguyên văn tại lúc chọn; nếu nguồn bị xóa, highlight vẫn còn.

### 4.7. Bảng ý tưởng

#### UC14. Quản lý bảng ý tưởng

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên (thêm ý, chốt, loại); Chủ workspace (đưa vào bàn) |
| Mục tiêu | Ghi ý, chọn ý để bàn, và ghi lại quyết định của nhóm kèm lý do |
| Tiền điều kiện | Là thành viên |
| Hậu điều kiện thành công | Bảng phản ánh đúng trạng thái từng ý; quyết định ghi người, thời điểm, lý do; kênh có tin hệ thống tương ứng |
| Yêu cầu | FR-85 – FR-92 |

##### Phần A. Đưa ý lên bảng ý tưởng

*Kích hoạt:* Lệnh `/idea`, `/note`, `/pin` trong kênh, hoặc nút "Thêm ý" trên trang Bảng ý tưởng  
*Tiền điều kiện:* Là thành viên

**Luồng chính (`/idea`)**

1. Thành viên gõ `/idea ‹nội dung›` và gửi.
2. Hệ thống thêm thẻ vào cột Đề xuất, ghi số thứ tự, người đưa lên, thời điểm, tin và kênh nguồn.
3. Kênh có tin hệ thống "Đã thêm #‹số› vào cột Đề xuất…", kèm liên kết tới bảng.

**Luồng thay thế**

- **A.A1. `/note ‹nội dung›`**: thêm vào mục ghi chú thay vì cột Đề xuất.
- **A.A2. Nút trên trang Bảng ý tưởng**: chọn loại (ý hoặc ghi chú), nhập nội dung, bấm Thêm.
- **A.A3. `/pin` khi đang trả lời một tin**: hệ thống ghim theo nội dung tin được trả lời:
  - chỉ có lời của người: ghim lời đó;
  - chỉ có một thẻ (trích dẫn, tóm tắt hội thoại, số liệu): ghim thẻ đó, giữ người nói và nhãn của thẻ;
  - có cả lời người lẫn thẻ: hệ thống hỏi "Ghim lời của ‹tên›", "Ghim đoạn của ‹agent›", hoặc "Ghim cả hai"; ghim cả hai tạo một ý gồm hai phần, mỗi phần ghi người nói riêng;
  - bản tóm tắt kênh: ghim được, thẻ ghi "Bản tóm tắt kênh do ‹agent› viết (chưa lọc)".

**Ngoại lệ**

- **A.E1. Nội dung trống**: không thêm; hướng dẫn cú pháp.
- **A.E2. `/pin` khi không trả lời tin nào**: hệ thống nhắc cần trả lời một tin trước.

**Quy tắc:** BR-20. Ý mới luôn ở cột Đề xuất. Highlight không tự lên bảng.

##### Phần B. Chuyển ý sang Đang bàn

*Kích hoạt:* Chủ bấm "Đưa vào bàn" trên thẻ  
*Tiền điều kiện:* Là chủ; ý đang ở cột Đề xuất

**Luồng chính**

1. Chủ bấm "Đưa vào bàn" trên một thẻ ở cột Đề xuất.
2. Thẻ chuyển sang cột Đang bàn.

**Ngoại lệ**

- **B.E1. Người không phải chủ**: không có nút; nếu gọi trực tiếp, hệ thống từ chối.
- **B.E2. Ý đã chốt hoặc đã loại**: không chuyển được.

**Quy tắc:** BR-21.

##### Phần C. Chốt hoặc loại ý

*Kích hoạt:* Bấm "Chốt" hoặc "Loại" trên thẻ, hoặc gõ `/decide #‹số› chốt|loại ‹lý do›` trong kênh  
*Tiền điều kiện:* Ý chưa ở Đã chốt hoặc Đã loại

**Luồng chính**

1. Thành viên bấm "Chốt" hoặc "Loại" trên thẻ.
2. Hộp thoại yêu cầu lý do; hộp thoại hiện lệnh `/decide` tương đương.
3. Thành viên nhập lý do (có thể trỏ tới số liệu) và xác nhận.
4. Thẻ chuyển sang cột tương ứng; kênh có tin hệ thống ghi quyết định.

**Luồng thay thế**

- **C.A1. Dùng lệnh `/decide`** trong kênh với cùng thông tin.

**Ngoại lệ**

- **C.E1. Thiếu lý do**: không cho xác nhận.
- **C.E2. Ý đã chốt hoặc đã loại**: báo không đổi được nữa.
- **C.E3. Số thẻ không tồn tại, hoặc là ghi chú**: báo lỗi.
- **C.E4. Lệnh nằm trong tin không do người gõ** (ví dụ trong thẻ trích dẫn lời agent): không thực hiện.

**Quy tắc:** BR-20, BR-21, BR-23. Cột Đã loại luôn hiển thị, để nhóm và agent nhớ những gì đã bị gạt bỏ và vì sao.

### 4.8. Tổng hợp

#### UC15. Tóm tắt kênh và bản tổng hợp

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Chủ workspace (tạo); Thành viên (xem, tải) |
| Tác nhân phụ | Nhà cung cấp AI (khi tóm tắt kênh) |
| Mục tiêu | Có bản tóm tắt các ý chính của kênh, và văn bản tổng kết các quyết định của nhóm |
| Tiền điều kiện | Là chủ workspace để tạo; tóm tắt kênh cần API key |
| Hậu điều kiện thành công | Bản tóm tắt hiện trong kênh dưới tên agent của chủ; bản tổng hợp mới nhất xem và tải được |
| Yêu cầu | FR-93 – FR-98 |

##### Phần A. Tóm tắt kênh (`/summarize`)

*Kích hoạt:* Chủ gõ `/summarize` trong kênh  
*Tiền điều kiện:* Là chủ; đã có API key

**Luồng chính**

1. Agent của chủ, bằng key của chủ, đọc đúng hai thứ: đề bài và các tin gần đây của chính kênh này.
2. Agent viết bản tóm tắt: các ý chính, ai đề xuất gì, điểm còn tranh luận; mỗi ý ghi rõ của ai ("[Khang] cho rằng…").
3. Bản tóm tắt hiện trong kênh dưới tên agent của chủ.

**Ngoại lệ**

- **A.E1. Người không phải chủ gõ lệnh**: hệ thống trả lời đây là quyền của chủ workspace.
- **A.E2. Chủ chưa có key**: hệ thống nhắc nhập key trước.
- **A.E3. Key lỗi**: tin báo lỗi dễ hiểu trong kênh.

**Quy tắc:** BR-24. Agent không đọc hội thoại riêng, highlight, tin của kênh hay workspace khác. Bản tóm tắt không tự vào ngữ cảnh agent của chủ; ai muốn agent đọc phần nào thì highlight phần đó (người nói "Bản tóm tắt kênh do ‹agent› viết (chưa lọc)").

##### Phần B. Dựng và tải bản tổng hợp (`/brief`)

*Kích hoạt:* Chủ gõ `/brief` trong kênh, hoặc bấm "Dựng"/"Dựng lại" trên trang Bản tổng hợp  
*Tiền điều kiện:* Là chủ (để dựng)

**Luồng chính**

1. Hệ thống dựng bản tổng hợp từ bảng ý tưởng: đề bài; ý đã chốt kèm lý do và người chốt; ý đã loại kèm lý do; ý còn đang bàn kèm người nêu; ghi chú.
2. Nếu workspace có số liệu: thêm mục "Số liệu dùng làm căn cứ" ghi lượt chạy, dataset, số tác vụ, tình trạng hợp lệ và các dòng tiêu chí; lượt không hợp lệ có lời nhắc không dùng làm kết luận.
3. Trang Bản tổng hợp ghi thời điểm dựng, người dựng, số thành viên.
4. Mọi thành viên xem bản mới nhất, "Sao chép" hoặc "Tải Markdown".

**Luồng thay thế**

- **B.A1. Chưa có bản tổng hợp**: trang hiện trạng thái rỗng, hướng dẫn chủ bấm Dựng hoặc gõ `/brief`; thành viên thường thấy lời giải thích chủ là người dựng.

**Ngoại lệ**

- **B.E1. Người không phải chủ gõ `/brief`**: hệ thống trả lời đây là quyền của chủ workspace.

**Quy tắc:** BR-24.

### 4.9. Số liệu bài báo

#### UC16. Nhập lượt chạy số liệu

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người nhập số liệu (chủ workspace hoặc người được giao) |
| Mục tiêu | Gắn kết quả thí nghiệm do nhóm ADOM giao vào workspace |
| Tiền điều kiện | Có quyền nhập số liệu trong workspace |
| Kích hoạt | Mở trang "Lượt chạy" và chọn tệp kết quả |
| Hậu điều kiện thành công | Lượt chạy gắn vào workspace; mục Số liệu xuất hiện; kênh "chung" có tin hệ thống |
| Yêu cầu | FR-99 – FR-102 |

**Luồng chính**

1. Người nhập chọn tệp: ba tệp do `export_report.py` của ADOM sinh ra (`<RUN>_summary.csv`, `<RUN>_per_task.csv`, `<RUN>_run_meta.json`), hoặc một tệp JSON định dạng `specgate-run/1`.
2. Hệ thống nhận diện từng tệp và hiện tệp nào đã đủ, tệp nào còn thiếu.
3. Người nhập đặt tên lượt chạy (tùy chọn, mặc định lấy trong tệp) và chọn tình trạng: hợp lệ, hoặc không hợp lệ kèm lý do.
4. Người nhập bấm "Nhập vào workspace".
5. Hệ thống kiểm định dạng đã thống nhất với nhóm ADOM, rồi gắn lượt chạy vào workspace.
6. Kênh "chung" nhận tin hệ thống, ví dụ "Đã có lượt chạy mới: MAIN, HumanEval+, 162 tác vụ".
7. Hệ thống mở trang Số liệu của lượt chạy vừa nhập.

**Luồng thay thế**

- **A1. Đánh dấu không hợp lệ sau khi nhập**: trên bảng lượt chạy, bấm "Đánh dấu không hợp lệ" và nhập lý do; hoặc "Đánh dấu hợp lệ" để bỏ.
- **A2. Gỡ lượt chạy**: bấm biểu tượng gỡ trên bảng lượt chạy.

**Ngoại lệ**

- **E1. Tệp không nhận ra**: báo tên tệp không nhận ra.
- **E2. Sai định dạng hoặc thiếu tệp**: báo lỗi, không gắn gì.
- **E3. Chọn "không hợp lệ" mà không có lý do**: không cho nhập.

**Quy tắc:** BR-26, BR-27.

#### UC17. Chạy thử thí nghiệm trên web

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Chủ workspace |
| Tác nhân phụ | Pipeline ADOM |
| Mục tiêu | Thử nhanh một ý bằng số liệu thật mà không chờ nhóm ADOM |
| Tiền điều kiện | Là chủ; workspace không có lượt chạy thử nào đang chạy |
| Kích hoạt | Chủ bấm "Chạy thử" trên trang Lượt chạy |
| Hậu điều kiện thành công | Lượt chạy thử gắn vào workspace với nhãn "chạy thử"; kênh "chung" có tin báo |
| Yêu cầu | FR-103 – FR-106 |

**Luồng chính**

1. Chủ nhập danh sách tác vụ (ví dụ HumanEval/1, HumanEval/13) trong giới hạn số tác vụ mỗi lần, và chọn mức cấu hình (A1 hoặc A3).
2. Chủ bấm "Chạy thử".
3. Trang hiện tiến độ trực tiếp: bước hiện tại (xếp hàng, dựng tác vụ, duyệt đặc tả, chạy kiểm chứng), tác vụ nào đã có kết luận và số vi phạm.
4. Chạy xong: kết quả tự lưu và gắn vào workspace như một lượt nhập, mang nhãn "chạy thử".
5. Kênh "chung" nhận tin báo lượt chạy thử đã xong.

**Luồng thay thế**

- **A1. Đóng trang hoặc mất mạng giữa chừng**: lượt chạy vẫn tiếp tục trên máy chủ; khi mở lại, trang hiện đúng tình trạng hiện tại.

**Ngoại lệ**

- **E1. Vượt số tác vụ tối đa**: nút chạy bị khóa, hiện số đã vượt.
- **E2. Đang có lượt chạy thử**: nút "Chạy thử" tạm khóa cho tới khi lượt đó xong.
- **E3. Lượt chạy lỗi giữa chừng**: lượt chạy ở trạng thái lỗi kèm lý do ngắn; kênh nhận tin báo lỗi.

**Quy tắc:** BR-26. Chạy thử dùng key và cấu hình do nhóm ADOM cài trên máy chủ; key của thành viên không bị dùng.

#### UC18. Xem số liệu và gọi thẻ số liệu trong kênh

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên |
| Mục tiêu | Dùng số liệu làm bằng chứng khi tranh luận |
| Tiền điều kiện | Workspace đã có ít nhất một lượt chạy |
| Kích hoạt | Mở mục "Số liệu", hoặc gõ `/stats`, `/task ‹mã›` trong kênh |
| Hậu điều kiện thành công | Thành viên thấy số liệu; thẻ số liệu (nếu gọi) là tin thật trong kênh |
| Yêu cầu | FR-107 – FR-112 |

**Luồng chính (trang Số liệu)**

1. Trên cùng là dải tình trạng: tên lượt chạy, dataset, số tác vụ, hợp lệ hay không (kèm lý do và lời nhắc không dùng làm kết quả chính thức nếu không hợp lệ), và liên kết sang các lượt khác.
2. Thanh thông tin: biến thể, số tác vụ, số vi phạm, mô hình đóng từng vai.
3. Thẻ "Tiêu chí": sáu thẻ, mỗi thẻ có tên tiêu chí bằng lời dễ hiểu, giá trị, khoảng tin cậy, ngưỡng, kết luận.
4. Thẻ "Tác vụ và cách sửa": bảng vi phạm theo tác vụ (lọc, sắp xếp được), bảng so sánh các cách sửa với hai cách làm đối chứng, và thống kê đồng thuận của hai bản nháp A3.

**Luồng thay thế**

- **A1. `/stats`**: kênh hiện thẻ số liệu gồm sáu tiêu chí rút gọn và tình trạng lượt chạy, kèm liên kết mở mục Số liệu.
- **A2. `/task ‹mã›`**: kênh hiện thẻ kết quả của tác vụ đó.
- **A3. Dùng thẻ**: thành viên highlight một dòng tiêu chí cho agent (UC13, bắt trọn dòng) hoặc ghim thẻ lên bảng (UC14 phần A).
- **A4. Lượt chạy về sau bị đánh dấu không hợp lệ hoặc có lượt mới hơn**: mọi bản chụp (thẻ trong kênh, highlight cho agent, thẻ bằng chứng trên bảng) hiện dòng nhắc tương ứng; ngữ cảnh agent gửi kèm cùng lời nhắc.

**Ngoại lệ**

- **E1. Workspace chưa có số liệu**: không có mục Số liệu; `/stats` và `/task` không có trong gợi ý lệnh.
- **E2. Mã tác vụ không có trong lượt chạy**: tin báo không tìm thấy.

**Quy tắc:** BR-27, BR-28. "Chưa đủ dữ liệu" không bao giờ được trình bày giống "Đạt".

### 4.10. Thành viên và cài đặt

#### UC19. Thành viên và cài đặt workspace

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Thành viên (tên, vai, rời nhóm); Chủ workspace (đề bài, mã, kênh, xóa thành viên) |
| Mục tiêu | Giữ danh tính rõ ràng trong nhóm cho cả người lẫn agent, và giữ thông tin workspace đúng |
| Tiền điều kiện | Là thành viên; một số thao tác yêu cầu là chủ |
| Hậu điều kiện thành công | Thay đổi có hiệu lực ngay ở mọi nơi trong workspace và trong ngữ cảnh agent từ câu hỏi tiếp theo |
| Yêu cầu | FR-113 – FR-121 |

##### Phần A. Quản lý tên, vai và tư cách thành viên

*Kích hoạt:* Mở trang "Thành viên và agent", khung "Agent đang đọc", hoặc hộp nhắc đặt biệt danh  
*Tiền điều kiện:* Là thành viên

**Luồng chính (xem danh sách thành viên)**

1. Trang "Thành viên và agent" liệt kê mỗi người: ảnh đại diện màu, tên trong workspace, chủ hay thành viên, vai trong nhóm (hoặc "chưa ghi"), tài khoản gốc, agent đang dùng (mô hình, nhà cung cấp) hoặc "chưa nhập key".
2. Không ai thấy key của người khác.

**Luồng thay thế**

- **A.A1. Đặt biệt danh khi tên trùng**: khi vào workspace với tên tạm (UC11 A1), hệ thống hiện hộp nhắc đặt tên trong workspace; người dùng nhập biệt danh hoặc để sau.
- **A.A2. Sửa vai trong nhóm** (tối đa 40 ký tự) trong khung "Agent đang đọc" của một hội thoại chọn workspace đó.
- **A.A3. Đổi tên trong workspace**: menu "…" ở dòng của mình, chọn "Đổi tên trong workspace", nhập tên mới.
- **A.A4. Rời workspace**: thành viên (không phải chủ) chọn "Rời workspace" trong menu "…" và xác nhận.
- **A.A5. Xóa thành viên**: chủ chọn "Xóa khỏi workspace" ở dòng của một thành viên và xác nhận.

**Ngoại lệ**

- **A.E1. Tên mới trùng tên một thành viên, kể cả người đã rời**: không cho lưu.
- **A.E2. Chủ chọn rời workspace của chính mình**: không có lựa chọn này.

**Quy tắc:** BR-25. Mỗi người chỉ sửa được tên và vai của chính mình. Tên đã dùng được giữ chỗ mãi cho người đó; người đã rời hiện "‹tên› (đã rời)" ở mọi nơi.

##### Phần B. Cấu hình workspace chung

*Kích hoạt:* Mở trang "Thành viên và agent", hoặc nút "Tạo kênh" trên cột bên  
*Tiền điều kiện:* Là chủ

**Luồng chính (sửa đề bài)**

1. Chủ sửa đề bài trong mục "Đề bài" và bấm "Lưu đề bài".
2. Hệ thống báo đã lưu; agent của mọi thành viên đọc đề bài mới từ câu hỏi tiếp theo.

**Luồng thay thế**

- **B.A1. Đổi mã tham gia**: chủ bấm "Đổi mã"; mã cũ hết hiệu lực ngay. Mọi thành viên xem và "Chép mã" được.
- **B.A2. Tạo kênh**: chủ bấm "Tạo kênh", nhập tên (chữ thường không dấu, số, gạch ngang), hệ thống tạo và mở kênh mới.
- **B.A3. Đổi tên và chế độ hiển thị** của workspace.

**Ngoại lệ**

- **B.E1. Đề bài trống**: không cho lưu.
- **B.E2. Tên kênh không hợp lệ hoặc trùng**: báo lỗi.
- **B.E3. Thành viên không phải chủ**: thấy đề bài ở dạng chỉ đọc; không có nút đổi mã, tạo kênh.

**Quy tắc:** BR-17, BR-18.

### 4.11. Kết nối

#### UC20. Tiếp tục làm việc khi mạng chập chờn

| Thuộc tính | Nội dung |
| --- | --- |
| Tác nhân chính | Người dùng |
| Mục tiêu | Không mất công sức khi mất mạng |
| Tiền điều kiện | Đang dùng website |
| Kích hoạt | Trình duyệt mất kết nối Internet |
| Hậu điều kiện thành công | Khi có mạng lại, người dùng tiếp tục đúng chỗ, không mất chữ đang soạn hay phần trả lời đã nhận |
| Yêu cầu | FR-122 – FR-125 |

**Luồng chính**

1. Trên cùng màn hình hiện dải "Mất kết nối, đang thử kết nối lại".
2. Nút gửi tạm khóa, để người dùng không tưởng tin đã đi.
3. Chữ đang soạn (câu hỏi cho agent, tin trong kênh) được giữ trên trình duyệt.
4. Khi có mạng lại, website tự kết nối lại; dải báo biến mất; kênh hiện bù những tin đã lỡ.

**Luồng thay thế**

- **A1. Mất mạng khi agent đang trả lời**: phần đã viết được giữ lại trong hội thoại; người dùng bấm "Tạo lại" nếu muốn câu trả lời đầy đủ.
- **A2. Mất mạng khi đang chạy thử**: lượt chạy tiếp tục trên máy chủ (UC17 A1).
- **A3. Tải lại trang khi đang soạn**: chữ đang soạn hiện lại.

**Quy tắc:** Website không có chế độ ngoại tuyến (mục 2.4).

---

## 5. Yêu cầu chức năng

Mỗi yêu cầu kiểm được bằng ít nhất một ca kiểm thử. Mức: **M** = bắt buộc trong đợt này; **T** = bản tối thiểu trong đợt này; **S** = làm sau.

### 5.1. Tài khoản và Trang chủ (UC01–UC02)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-01 | Mọi trang trừ trang đăng nhập đều yêu cầu đăng nhập; chưa đăng nhập thì chuyển về trang đăng nhập và quay lại đúng trang định mở sau khi đăng nhập | M |
| FR-02 | Chỉ có hai cách đăng ký/đăng nhập: Google và GitHub, qua trang chọn tài khoản của nhà cung cấp | M |
| FR-03 | Lần đầu đăng ký, hệ thống tạo tài khoản và workspace riêng rồi đưa người dùng tới màn nhập key kèm lời chào | M |
| FR-04 | Danh tính đã đăng ký thì đăng nhập luôn và tới Trang chủ; không bao giờ tạo tài khoản trùng | M |
| FR-05 | Người dùng đăng xuất được từ menu tài khoản hoặc khung người dùng | M |
| FR-06 | Phiên được nhớ 30 ngày và tính lại từ đầu mỗi lần quay lại; hủy ở trang nhà cung cấp thì quay về trang đăng nhập, không tạo gì | M |
| FR-07 | Trang chủ chỉ gồm thanh workspace, hình minh họa, câu chào, menu tài khoản và vài nút đi vào chức năng chính; logo ở mọi trang dẫn về Trang chủ | M |
| FR-08 | Thanh bên hiện dấu báo tin chưa đọc, dấu báo được nhắc tên, và số yêu cầu đang chờ (với workspace mình làm chủ); tên kênh có chấm tin chưa đọc | M |
| FR-09 | Dấu báo tự cập nhật không cần tải lại và tự mất khi đã đọc hoặc đã xử lý | M |

### 5.2. Workspace riêng (UC03–UC05)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-10 | Người dùng chọn nhà cung cấp (Anthropic hoặc kiểu OpenAI kèm địa chỉ API) và nhập API key | M |
| FR-11 | Hệ thống kiểm key ngay với nhà cung cấp; hợp lệ thì lưu và hiện danh sách mô hình để chọn | M |
| FR-12 | Key sai, hết tiền, hoặc không kết nối được thì báo bằng câu tiếng Việt dễ hiểu và không lưu key | M |
| FR-13 | Màn nhập key ghi rõ gói thuê bao không phải API key | M |
| FR-14 | Sau khi lưu chỉ hiện 4 ký tự cuối của key; đổi mô hình, đổi key (ẩn sau nút "Đổi key") và xóa key (có xác nhận) ở cùng màn hình | M |
| FR-15 | Danh sách hội thoại mới nhất ở trên; tạo, mở hội thoại; tên tự lấy từ câu hỏi đầu | M |
| FR-16 | Mỗi lời gọi gửi kèm các lượt trước đó; hội thoại quá dài thì chỉ gửi các lượt gần nhất | M |
| FR-17 | Câu hỏi lưu trước khi agent trả lời; câu trả lời hiện dần và có định dạng Markdown | M |
| FR-18 | Có nút "Dừng" trong lúc trả lời; phần đã viết được giữ lại | M |
| FR-19 | Có nút "Chép" dưới câu trả lời và nút chép riêng cho từng khối code | M |
| FR-20 | Lỗi nhà cung cấp hiện ngay trong hội thoại thay cho câu trả lời; lượt lỗi không gửi lại cho agent | M |
| FR-21 | "Tạo lại" giữ câu trả lời cũ thành phiên bản, có nút chuyển phiên bản "‹ 1/2 ›" | M |
| FR-22 | Agent chỉ đọc phiên bản đang hiển thị; highlight của phiên bản cũ vẫn gắn đúng phiên bản đó | M |
| FR-23 | Đổi tên hội thoại; xóa hội thoại hỏi giữ hay xóa highlight riêng (mặc định giữ, ghi "hội thoại gốc đã bị xóa") | M |
| FR-24 | Bôi đen trong câu trả lời hoặc câu hỏi của mình thì hiện thanh chọn màu và ghi chú để lưu highlight riêng | M |
| FR-25 | Highlight riêng được tô màu ngay trong hội thoại | M |
| FR-26 | Highlight riêng lưu nguyên văn, người nói, tên mô hình lúc tạo, lượt gốc, và ngữ cảnh nhóm tại lúc agent viết | M |
| FR-27 | Danh sách Highlight riêng xếp theo thời gian, lọc theo màu, hội thoại, loại, đã gửi hay chưa, tìm theo chữ | M |
| FR-28 | Bấm một highlight mở lại đúng hội thoại, đúng chỗ | M |
| FR-29 | Sửa nội dung, màu, ghi chú; xóa từng mục; "Dọn dẹp" xóa nhiều mục theo màu, hội thoại hoặc đã gửi | M |
| FR-30 | Tối đa khoảng 200 highlight riêng mỗi người; gần đủ thì nhắc dọn bớt | M |

### 5.3. Ngữ cảnh nhóm (UC06)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-31 | Mỗi hội thoại có ô "Ngữ cảnh nhóm" chọn tối đa một workspace chung mình là thành viên; đổi hoặc bỏ bất cứ lúc nào; hội thoại mới chọn được trước câu hỏi đầu | M |
| FR-32 | Hội thoại có ngữ cảnh nhóm có biểu tượng riêng trong danh sách | M |
| FR-33 | Mỗi câu hỏi gửi kèm: đề bài; thành viên (tên, chủ, vai, agent); ý đã chốt và đã loại kèm lý do và lời dặn không đề xuất lại; tin của mình; highlight cho agent của mình; số liệu (nếu có). Không gửi tin nào khác của người khác | M |
| FR-34 | Ngữ cảnh được lấy mới ở mỗi câu hỏi | M |
| FR-35 | Tin của mình và highlight xếp chung một dòng thời gian, mỗi mục ghi giờ, kênh, người nói và tin đang trả lời | M |
| FR-36 | Khung "Agent đang đọc" hiện đúng nội dung FR-33; sửa được vai trong nhóm và bỏ được highlight ngay trong khung | M |
| FR-37 | Không còn là thành viên thì hội thoại vẫn còn nhưng agent không nhận thông tin nhóm | M |
| FR-38 | Gửi nguyên văn khoảng 50 tin gần nhất của mình; tin cũ hơn tạm không gửi và khung ghi rõ số tin đang bị bỏ | M |
| FR-39 | "Tóm tắt tin cũ" chỉ chạy khi người dùng bấm, sau khi cho biết số tin, số khối và số lần gọi agent | M |
| FR-40 | Tin cũ chia khối tại mốc giờ của từng highlight; khối dưới khoảng 5 tin giữ nguyên văn; mọi khối cần tóm tắt gửi trong một lần gọi; mỗi khối ghi khoảng thời gian | M |
| FR-41 | Bản tóm tắt tin cũ được lưu và gửi kèm thay cho tin cũ; lưu được vào Highlight riêng để chia sẻ; key lỗi thì giữ bản cũ | M |

### 5.4. Đưa kết quả vào kênh (UC07–UC08)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-42 | Từ danh sách Highlight riêng gửi được một hoặc nhiều mục vào một kênh, chọn workspace, kênh, viết thêm lời, sửa nội dung trước khi gửi | M |
| FR-43 | Hộp thoại hiện trước nhãn người nói theo ba mức: trọn câu, "(trích một phần)", "(‹tên› đã chỉnh)" | M |
| FR-44 | Tin trong kênh hiện dưới tên người gửi, mỗi highlight là một thẻ trích dẫn ghi người nói; thẻ có "…" ở chỗ cắt | M |
| FR-45 | Gửi lại vào đúng kênh đã gửi thì hệ thống nhắc và yêu cầu xác nhận | M |
| FR-46 | Gửi sang workspace khác với ngữ cảnh lúc agent viết thì hiện cảnh báo và yêu cầu xác nhận | M |
| FR-47 | Danh sách Highlight riêng ghi lại từng lần gửi (workspace, kênh, thời điểm) | M |
| FR-48 | Gõ `@` trong ô soạn có mục "Highlight của tôi" đứng đầu gợi ý | M |
| FR-49 | Bảng chọn highlight lọc được theo màu, tìm theo chữ, chèn được nhiều thẻ vào một tin, bỏ được thẻ trước khi gửi | M |
| FR-50 | "Tóm tắt cho nhóm" tạo bản tóm tắt theo khung bốn phần, mỗi ý ghi rõ của ai | T |
| FR-51 | Bản tóm tắt được lưu vào Highlight riêng, không gửi ngay | T |
| FR-52 | Đính kèm được tối đa 4 lượt hỏi đáp gốc vào bản tóm tắt | T |
| FR-53 | Trong kênh, bản tóm tắt là thẻ riêng ghi "Tóm tắt hội thoại của ‹tên›, do ‹agent› viết, chưa được lọc"; lượt gốc thu gọn trong thẻ | T |

### 5.5. Workspace chung và tham gia (UC09–UC11)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-54 | Tạo workspace với tên, đề bài, chế độ hiển thị; workspace mới có kênh "chung" và mã tham gia; người tạo là chủ | M |
| FR-55 | Tên, đề bài bắt buộc; tên không trùng workspace khác mình làm chủ; làm chủ tối đa khoảng 10 | M |
| FR-56 | Không cần API key để tạo workspace | M |
| FR-57 | Mã tham gia 7 ký tự chữ và số, không dùng ký tự dễ nhầm; mọi thành viên xem và chép được | M |
| FR-58 | Nhập mã chấp nhận chữ thường, dấu cách, gạch nối; mã sai hoặc đã đổi thì báo không hợp lệ | M |
| FR-59 | Nhập mã hợp lệ tạo yêu cầu và mở trang "Đang chờ duyệt"; được duyệt thì trang tự chuyển vào workspace | M |
| FR-60 | Workspace đang chờ duyệt hiện mờ trên thanh bên | M |
| FR-61 | Mỗi người tối đa một yêu cầu đang chờ cho mỗi workspace; người xin tự hủy được | M |
| FR-62 | Trang Khám phá liệt kê workspace "ai cũng tìm thấy", tìm theo tên hoặc đề bài | M |
| FR-63 | Mỗi workspace ở Khám phá hiện quan hệ: chưa tham gia, đang chờ, đã là thành viên | M |
| FR-64 | Gửi yêu cầu kèm lời nhắn từ Khám phá; mở workspace chưa là thành viên thì chuyển sang Khám phá chọn sẵn workspace đó | M |
| FR-65 | Chỉ chủ thấy trang "Yêu cầu tham gia"; trang tự cập nhật | M |
| FR-66 | Mỗi yêu cầu hiện người xin, cách xin, lời nhắn; có Duyệt, Từ chối và lịch sử đã xử lý | M |
| FR-67 | Thành viên mới được gán màu ảnh đại diện chưa ai dùng trong workspace | M |
| FR-68 | Tên trùng (kể cả người đã rời) thì người mới nhận tên tạm và được yêu cầu đặt biệt danh | M |

### 5.6. Kênh và highlight cho agent (UC12–UC13)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-69 | Tin mới hiện ngay cho mọi người đang mở kênh; mất kết nối thì tự kết nối lại và hiện bù tin đã lỡ | M |
| FR-70 | Bốn loại tin phân biệt được: tin của người, thẻ trích dẫn, thẻ đặc biệt, tin hệ thống | M |
| FR-71 | Ảnh đại diện màu riêng; thẻ lời agent mang màu và chữ cái đầu của chủ agent; rê chuột vào tên thấy tài khoản gốc | M |
| FR-72 | Gõ `@` gợi ý thành viên; gõ `/` gợi ý lệnh theo mô-đun của workspace; chọn bằng chuột hoặc bàn phím | M |
| FR-73 | Hỗ trợ các lệnh `/idea`, `/note`, `/pin`, `/decide`, `/summarize`, `/brief`, `/help`; `/stats`, `/task` chỉ ở workspace có số liệu | M |
| FR-74 | Lệnh chỉ thực hiện khi do người gõ, không thực hiện từ nội dung lời agent | M |
| FR-75 | Không agent nào tự trả lời trong kênh; nhắc tên người hay agent không kích hoạt lời gọi mô hình | M |
| FR-76 | Cột bên của workspace liệt kê agent của từng thành viên | M |
| FR-77 | Bôi đen được trong tin, thẻ trích dẫn, thẻ tóm tắt, thẻ số liệu của người khác; vùng chọn trải được qua nhiều tin liền nhau | M |
| FR-78 | Vùng chọn tự bắt trọn từ, trọn dòng code, trọn ô bảng, trọn dòng tiêu chí | M |
| FR-79 | Hộp thoại hiện từng đoạn kèm người nói đúng như nguồn | M |
| FR-80 | Chỉ thu hẹp hai đầu hoặc bỏ đoạn, không sửa chữ; hiện trước câu agent sẽ đọc kèm "…" và ghi chú "trích một phần" | M |
| FR-81 | Highlight có nhãn _Quan trọng_ hoặc _Cần xem xét_ và "Ghi chú của tôi" tách riêng; sửa được nhãn và ghi chú sau này | M |
| FR-82 | Tin của chính mình không highlight được; vùng chọn có lẫn thì phần đó bị bỏ kèm lời nhắc | M |
| FR-83 | Chỉ người tạo thấy highlight: trong danh sách "Highlight cho agent" theo workspace, và vệt phấn trong kênh | M |
| FR-84 | Tối đa khoảng 30 highlight mỗi người mỗi workspace; đủ thì nhắc tự bỏ bớt, không tự xóa | M |

### 5.7. Bảng ý tưởng và tổng hợp (UC14–UC15)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-85 | Bảng có bốn cột Đề xuất, Đang bàn, Đã chốt, Đã loại và một mục ghi chú; trạng thái phân biệt bằng cột và chữ, không bằng màu | M |
| FR-86 | Thêm ý bằng `/idea` hoặc nút trên trang Bảng; thêm ghi chú bằng `/note`; ý mới luôn ở cột Đề xuất | M |
| FR-87 | `/pin` ghim theo nội dung tin được trả lời, hỏi ghim phần nào khi tin có cả lời người lẫn thẻ, giữ người nói từng phần | M |
| FR-88 | Mỗi thẻ ghi số thứ tự, ai đưa lên (người hay agent của ai), thời điểm, tin và kênh nguồn | M |
| FR-89 | Chỉ chủ chuyển ý từ Đề xuất sang Đang bàn | M |
| FR-90 | Chốt hoặc loại bắt buộc lý do, qua nút trên thẻ hoặc `/decide`; hộp thoại hiện lệnh tương đương | M |
| FR-91 | Ghi người quyết định và thời điểm; kênh có tin hệ thống về quyết định | M |
| FR-92 | Ý đã chốt hoặc đã loại không quay lại cột khác; cột Đã loại luôn hiển thị | M |
| FR-93 | `/summarize` chỉ chủ dùng được; agent của chủ chỉ đọc đề bài và tin của chính kênh | M |
| FR-94 | Bản tóm tắt kênh hiện dưới tên agent của chủ, mỗi ý ghi của ai, ghi "chưa ai lọc" | M |
| FR-95 | Chủ chưa có key thì `/summarize` nhắc nhập key; bản tóm tắt không tự vào ngữ cảnh agent của chủ | M |
| FR-96 | `/brief` hoặc nút trên trang Bản tổng hợp (chỉ chủ) dựng bản tổng hợp từ bảng: đã chốt, đã loại kèm lý do, đang bàn, ghi chú | M |
| FR-97 | Bản tổng hợp có mục "Số liệu dùng làm căn cứ" khi workspace có số liệu | S |
| FR-98 | Mọi thành viên xem bản mới nhất, sao chép, tải dạng Markdown | M |

### 5.8. Số liệu bài báo (UC16–UC18)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-99 | Nhập lượt chạy từ ba tệp `export_report.py` hoặc một tệp `specgate-run/1`; hệ thống nhận diện và hiện tệp còn thiếu | M |
| FR-100 | Hệ thống kiểm định dạng trước khi gắn; sai định dạng thì báo lỗi và không gắn | M |
| FR-101 | Nhập xong thì mục Số liệu xuất hiện và kênh "chung" nhận tin hệ thống | M |
| FR-102 | Đánh dấu không hợp lệ (bắt buộc lý do), đánh dấu lại hợp lệ, gỡ lượt chạy | M |
| FR-103 | Chỉ chủ thấy "Chạy thử"; chọn tác vụ trong giới hạn và mức cấu hình | T |
| FR-104 | Trang hiện tiến độ trực tiếp theo bước và theo tác vụ | T |
| FR-105 | Lượt chạy thử tự lưu với nhãn "chạy thử"; kênh nhận tin xong hoặc lỗi kèm lý do | T |
| FR-106 | Mỗi workspace chỉ một lượt chạy thử tại một thời điểm | T |
| FR-107 | Trang Số liệu có dải tình trạng lượt chạy luôn ở trên cùng | M |
| FR-108 | Sáu thẻ tiêu chí có giá trị, khoảng tin cậy, ngưỡng, kết luận; "Chưa đủ dữ liệu" không trình bày giống "Đạt" | M |
| FR-109 | Kết quả theo tác vụ và bảng so sánh cách sửa | M |
| FR-110 | `/stats` hiện thẻ số liệu trong kênh | M |
| FR-111 | `/task ‹mã›` hiện thẻ kết quả tác vụ | S |
| FR-112 | Lượt chạy bị đánh dấu không hợp lệ hoặc có lượt mới hơn thì mọi bản chụp (thẻ kênh, highlight cho agent, thẻ trên bảng) hiện dòng nhắc, và ngữ cảnh agent gửi kèm lời nhắc | M |

### 5.9. Thành viên, cài đặt và kết nối (UC19–UC20)

| Mã | Yêu cầu | Mức |
| --- | --- | --- |
| FR-113 | Mọi thành viên xem danh sách thành viên: màu, tên, quyền, vai, tài khoản gốc, agent hoặc "chưa nhập key"; không hiện key | M |
| FR-114 | Tên trong workspace duy nhất, kể cả so với người đã rời; mỗi người tự đổi tên của mình | M |
| FR-115 | Vai trong nhóm tối đa 40 ký tự, chỉ chủ của vai sửa được | M |
| FR-116 | Thành viên (không phải chủ) rời được workspace; chủ xóa được thành viên; cả hai có hộp xác nhận | M |
| FR-117 | Người đã rời hiện "‹tên› (đã rời)" ở mọi nơi; vào lại thì lấy lại tên cũ | M |
| FR-118 | Chủ sửa đề bài; thành viên khác thấy đề bài dạng chỉ đọc | M |
| FR-119 | Chủ đổi mã tham gia; mã cũ hết hiệu lực ngay | M |
| FR-120 | Chủ tạo kênh mới với tên hợp lệ, không trùng | M |
| FR-121 | Chủ đổi tên và chế độ hiển thị của workspace | M |
| FR-122 | Mất kết nối thì hiện dải báo và khóa nút gửi | M |
| FR-123 | Chữ đang soạn được giữ trên trình duyệt qua mất mạng và tải lại trang | M |
| FR-124 | Tự kết nối lại khi có mạng; kênh hiện bù tin đã lỡ | M |
| FR-125 | Phần câu trả lời đã nhận được giữ khi mất mạng; lượt chạy thử tiếp tục trên máy chủ | M |

---

## 6. Quy tắc nghiệp vụ

| Mã | Quy tắc |
| --- | --- |
| BR-01 | Tài khoản chỉ tạo bằng Google hoặc GitHub; mỗi tài khoản Google/GitHub ứng với đúng một tài khoản SpecGate |
| BR-02 | Không có chế độ khách; không có đường dẫn cho người chưa là thành viên vào thẳng workspace chung |
| BR-03 | Trang chủ giữ gọn; thông báo nằm ở thanh bên, không nằm ở Trang chủ |
| BR-04 | Mỗi người một key và một agent; agent ở workspace riêng và agent mang tên người đó trong kênh là một |
| BR-05 | Key lưu mã hóa, chỉ hiện 4 ký tự cuối, không ai xem lại được key đầy đủ, kể cả chủ key; không ai thấy key của người khác |
| BR-06 | Mọi lời gọi mô hình chạy bằng key của chủ agent và tính tiền vào key đó; riêng chạy thử dùng key do nhóm ADOM cài trên máy chủ |
| BR-07 | Chỉ chủ hội thoại mở được hội thoại; đoán đường dẫn của người khác chỉ nhận "không tìm thấy" |
| BR-08 | Highlight riêng chỉ người tạo thấy, không tự vào kênh hay ngữ cảnh agent; màu không đi theo khi gửi |
| BR-09 | Highlight riêng chỉ bị xóa khi chính người dùng xóa; giữ nguyên khi đổi key, đổi mô hình, tạo lại câu trả lời |
| BR-10 | Mỗi hội thoại lấy ngữ cảnh từ tối đa một workspace tại một thời điểm; ngữ cảnh lấy mới ở mỗi câu hỏi |
| BR-11 | Agent chỉ đọc tin của người khác qua highlight cho agent của chủ nó; việc được nhắc tên không làm tin lọt vào ngữ cảnh |
| BR-12 | Mọi đoạn trích ghi đúng mức trung thực: trọn câu giữ nhãn gốc; cắt giữa câu có "…" và "trích một phần"; xóa hoặc sửa chữ ở giữa ghi "(‹tên› đã chỉnh)" |
| BR-13 | Thẻ trong kênh, highlight và thẻ trên bảng là bản chụp; sửa hay xóa nguồn sau đó không làm đổi bản chụp |
| BR-14 | Bản tóm tắt kênh (`/summarize`) không tính là tin của chủ và không tự vào ngữ cảnh agent của bất kỳ ai |
| BR-15 | Lưu lại, xem lại, rồi mới gửi: mọi thứ vào kênh từ workspace riêng phải đi qua danh sách Highlight riêng; chỉ chủ agent gửi được lời agent của mình; tin giữ tên mô hình lúc gửi |
| BR-16 | Không gửi nguyên văn cả hội thoại riêng vào kênh và không xuất hội thoại riêng ra tệp |
| BR-17 | Workspace chung không có agent của riêng nó và không có agent trọng tài tự động |
| BR-18 | Cả hai đường vào workspace (mã, Khám phá) đều chờ chủ duyệt; đổi mã làm mã cũ hết hiệu lực ngay |
| BR-19 | Không agent nào tự trả lời trong kênh, không agent nào gọi agent khác |
| BR-20 | Lệnh chỉ thực hiện khi do người gõ; agent không thể tự chốt, tự loại hay tự đưa ý lên bảng |
| BR-21 | Chỉ chủ chuyển ý sang Đang bàn. Chốt và loại hiện do mọi thành viên làm được, miễn ghi tên và lý do (điểm mở 9.3) |
| BR-22 | Highlight cho agent: không sửa chữ của người khác; mỗi đoạn giữ người nói và tin gốc riêng; chưa phải quyết định của nhóm; không tự lên bảng |
| BR-23 | Chốt và loại bắt buộc lý do, chỉ con người làm, không quay ngược |
| BR-24 | `/summarize` và `/brief` là quyền của chủ workspace; `/summarize` chỉ đọc đề bài và tin của chính kênh |
| BR-25 | Tên trong workspace duy nhất và được giữ chỗ mãi cho người đã dùng; người đã rời hiện "(đã rời)"; mỗi tin, thẻ, highlight gắn với thành viên chứ không chỉ chuỗi tên |
| BR-26 | Lượt chạy thử luôn mang nhãn "chạy thử"; mỗi workspace một lượt chạy thử tại một thời điểm |
| BR-27 | Lượt chạy không hợp lệ phải ghi lý do và luôn hiện lời nhắc không dùng làm kết luận; "Chưa đủ dữ liệu" không bao giờ trình bày như "Đạt" |
| BR-28 | Lời nhắc lượt chạy (không hợp lệ, đã có lượt mới hơn) đi theo mọi bản chụp số liệu và vào ngữ cảnh agent; chữ của bản chụp giữ nguyên |

---

## 7. Yêu cầu phi chức năng

| Mã | Loại | Yêu cầu |
| --- | --- | --- |
| NFR-01 | Bảo mật | API key mã hóa khi lưu, chỉ ghi không đọc lại; không xuất hiện trong log, phản hồi API hay tab Network của trình duyệt |
| NFR-02 | Bảo mật | Mọi lời gọi mô hình đi qua máy chủ SpecGate |
| NFR-03 | Bảo mật | Đăng nhập dùng OAuth của Google/GitHub với tham số `state` chống giả mạo; phiên lưu trong cookie httpOnly |
| NFR-04 | Phân quyền | Mỗi thao tác kiểm quyền ở máy chủ (thành viên, chủ workspace, chủ hội thoại, chủ highlight), không dựa vào việc ẩn nút |
| NFR-05 | Riêng tư | Hội thoại, highlight riêng, highlight cho agent chỉ chủ của chúng đọc được, kể cả qua API |
| NFR-06 | Hiệu năng | Tin mới tới các thành viên khác trong dưới 2 giây |
| NFR-07 | Hiệu năng | Câu trả lời bắt đầu hiện ngay khi nhà cung cấp trả chữ đầu tiên |
| NFR-08 | Chi phí | Ngữ cảnh nhóm có giới hạn (mục 2.6); không lời gọi mô hình nào chạy mà người dùng chưa bấm |
| NFR-09 | Dễ dùng | Lỗi nhà cung cấp (key sai, hết tiền, quá giới hạn, mất kết nối) hiện thành câu tiếng Việt dễ hiểu |
| NFR-10 | Dễ dùng | Mỗi màn có trạng thái đang tải, rỗng và lỗi |
| NFR-11 | Dễ dùng | Thao tác xóa và rời đều có hộp xác nhận trong ứng dụng, không dùng hộp thoại mặc định của trình duyệt |
| NFR-12 | Truy cập | Thao tác chính dùng được bằng bàn phím; độ tương phản chữ đạt WCAG AA |
| NFR-13 | Tương thích | Dùng được trên trình duyệt desktop phổ biến bản mới; bố cục co giãn theo độ rộng, cột bên thành ngăn kéo khi màn hình hẹp |
| NFR-14 | Quốc tế hóa | Mọi chữ hiển thị nằm trong tệp ngôn ngữ (tiếng Việt mặc định, có tiếng Anh) |
| NFR-15 | Kết nối | Cần Internet; xử lý mất kết nối theo UC20 |
| NFR-16 | API | API có phiên bản trong đường dẫn (`/api/v1`); lỗi trả về dạng `{ "error": { "code", "message", "details" } }` |

---

## 8. Ngoài phạm vi và việc làm sau

### 8.1. Không làm

- Quản trị hệ thống và mọi chức năng của quản trị viên.
- Dùng gói thuê bao (Claude Pro, ChatGPT Plus) thay cho API key; tiện ích trình duyệt điều khiển trang của nhà cung cấp.
- Agent tìm kiếm web, đọc tệp hay ảnh, chạy code; tải tệp hay ảnh vào chat.
- Gửi nguyên văn cả hội thoại riêng vào kênh; xuất hội thoại riêng ra tệp.
- Agent của riêng workspace chung, agent trọng tài tự động, agent tự trả lời khi được nhắc tên, agent gọi agent.
- Chạy cả dataset lớn của bài báo trên web.
- Nhiều key hoặc nhiều agent cho một người.
- Chế độ dùng khi mất mạng.
- Mật khẩu riêng, đăng nhập bằng email.

### 8.2. Làm sau

- Phần số liệu làm sau: thẻ từng tác vụ (`/task`), gắn thẻ số liệu làm bằng chứng cho ý, mục số liệu trong bản tổng hợp, môi trường cô lập và hàng đợi bền cho chạy thử.
- Lệnh `/check` do chủ chủ động gọi: agent của chủ đối chiếu ý mới với bảng ý tưởng và chỉ ra chỗ trùng hoặc mâu thuẫn; không tự chốt, không tự loại, không tự chạy.
- Mời thành viên qua email hoặc GitHub.
- Dùng gói thuê bao qua kết nối từ ứng dụng của nhà cung cấp.
- Sửa và xóa tin trong kênh.

---

## 9. Điểm còn mở

Tài liệu ghi phương án đang áp dụng trong ngoặc; nhóm xác nhận hoặc đổi.

1. **Số lượt gần nhất gửi cho agent khi hội thoại quá dài** (theo cấu hình máy chủ).
2. **Giữ `/summarize` hay chỉ dùng `/brief`** (giữ cả hai, UC15 phần A và B).
3. **Ai được chốt và loại ý** (mọi thành viên, ghi tên và lý do, BR-21). Phương án khác: chỉ chủ, cho trách nhiệm rõ ràng như việc chuyển sang Đang bàn.
4. **Khi rời, bị xóa khỏi workspace, hoặc workspace bị xóa**: phần tên đã chốt (BR-25). Hội thoại có ngữ cảnh nhóm vẫn còn nhưng không nhận ngữ cảnh (FR-37); highlight cho agent của người đó trong workspace không còn được dùng. Chưa có chức năng xóa workspace.
5. **Bản tóm tắt hội thoại làm trong đợt này hay để sau** (làm bản tối thiểu, FR-50 – FR-53 mức T).
6. **Định dạng kết quả của nhóm ADOM và người nhập** (ba tệp `export_report.py` hoặc `specgate-run/1`; người nhập là chủ workspace). Cần xác nhận nhóm ADOM đồng ý cho website gọi pipeline để chạy thử.
7. **Các giới hạn số lượng** ở mục 2.6 (200, 30, 10, 50, 5, 4, số tác vụ chạy thử).
8. **Danh sách màu highlight riêng** (năm màu: vàng, xanh lá, xanh dương, hồng, tím).
9. **Hội thoại mới tự chọn sẵn ngữ cảnh nhóm** (không, người dùng tự chọn).
10. **Tin gốc bị sửa hoặc bị xóa thì highlight xử lý thế nào** (để sau, vì chưa có chức năng sửa và xóa tin).

---

## 10. Ma trận truy vết

| Ca sử dụng | Yêu cầu chức năng | Quy tắc |
| --- | --- | --- |
| UC01 | FR-01 – FR-06 | BR-01, BR-02 |
| UC02 | FR-07 – FR-09 | BR-03 |
| UC03 | FR-10 – FR-14 | BR-04, BR-05 |
| UC04 | FR-15 – FR-23 | BR-06, BR-07, BR-09, BR-13 |
| UC05 | FR-24 – FR-30 | BR-08, BR-09, BR-12 |
| UC06 | FR-31 – FR-41 | BR-06, BR-10, BR-11, BR-14, BR-28 |
| UC07 | FR-42 – FR-49 | BR-12, BR-13, BR-15 |
| UC08 | FR-50 – FR-53 | BR-15, BR-16 |
| UC09 | FR-54 – FR-56 | BR-17 |
| UC10 | FR-57 – FR-64 | BR-18 |
| UC11 | FR-65 – FR-68 | BR-18, BR-25 |
| UC12 | FR-69 – FR-76 | BR-19, BR-20 |
| UC13 | FR-77 – FR-84 | BR-11, BR-12, BR-22, BR-28 |
| UC14 | FR-85 – FR-92 | BR-20, BR-21, BR-23 |
| UC15 | FR-93 – FR-98 | BR-14, BR-24 |
| UC16 | FR-99 – FR-102 | BR-26, BR-27 |
| UC17 | FR-103 – FR-106 | BR-06, BR-26 |
| UC18 | FR-107 – FR-112 | BR-27, BR-28 |
| UC19 | FR-113 – FR-121 | BR-17, BR-18, BR-25 |
| UC20 | FR-122 – FR-125 | |

---

## 11. Thay đổi so với bản 0.2

Bản 0.3 viết lại theo `flow.md` đã chốt. Khi bản 0.2 khác flow, tài liệu theo flow.

| Chủ đề | Bản 0.2 | Bản 0.3 |
| --- | --- | --- |
| Đưa lời agent vào kênh | Nút "Gửi vào kênh" dưới câu trả lời, gửi thẳng | Lưu, xem lại, rồi mới gửi: mọi thứ phải đi qua danh sách Highlight riêng (UC07) |
| Highlight riêng | Không có | Thêm UC05: bôi đen trong hội thoại, chọn màu, ghi chú, danh sách quản lý, dọn dẹp |
| Tóm tắt hội thoại cho nhóm | Làm sau | Thêm UC08 (bản tối thiểu) |
| Tạo lại câu trả lời | Không đặc tả | Thêm vào UC04: phiên bản, agent đọc phiên bản đang hiện |
| Trung thực của đoạn trích | Không đặc tả | Ba mức trọn câu, trích một phần, đã chỉnh (BR-12); vùng chọn bắt theo loại nội dung |
| Highlight cho agent | Một đoạn, sửa được chữ | Nhiều đoạn qua nhiều tin, mỗi đoạn giữ người nói; không sửa chữ; có ghi chú riêng (UC13) |
| Ngữ cảnh nhóm | Tin của mình và highlight tách rời | Một dòng thời gian chung; giới hạn 50 tin; "Tóm tắt tin cũ" theo khối do người dùng bấm (UC06) |
| Trang chủ và dấu báo | Không có | Thêm UC02 |
| Bảng ý tưởng | Mọi thành viên chuyển cột | Chỉ chủ chuyển sang Đang bàn (UC14); `/pin` hỏi ghim phần nào |
| `/summarize` | Agent của chủ đọc kênh | Chỉ đọc đề bài và tin của chính kênh; không tự vào ngữ cảnh của chủ (BR-14) |
| Tên trong workspace | Không đặc tả | Duy nhất, giữ chỗ mãi, "(đã rời)" (BR-25, UC19) |
| Số liệu bài báo | Ngoài phạm vi | Thêm UC16 – UC18 và các quy tắc BR-26 – BR-28 |
| Kết nối mạng | Không đặc tả | Thêm UC20 |
| Ca sử dụng | UC01 – UC15 | UC01 – UC20, các chức năng cùng mục tiêu được gộp thành phần A, B, C của một ca |

---

## 12. Phụ lục: sơ đồ UML

Mã nguồn PlantUML nằm trong thư mục [`uml/`](../uml/README.md), ảnh SVG trong `uml/img/`. Sơ đồ mô tả hành vi ở mức người dùng và hệ thống, không ràng buộc cách cài đặt. Khi đăng lên GitHub Gist, đường dẫn tương đối không mở được; hãy đăng kèm các tệp SVG hoặc thay bằng đường dẫn tuyệt đối tới kho mã.

| Loại | Nội dung | Ca sử dụng | Mã nguồn | Ảnh |
| --- | --- | --- | --- | --- |
| Ca sử dụng | Tổng quát 20 ca | UC01 – UC20 | [00-overview.puml](../uml/use-case/00-overview.puml) | [SVG](../uml/img/00-overview.svg) |
| Ca sử dụng | Workspace riêng và đường riêng sang chung | UC03 – UC08 | [01-private-workspace.puml](../uml/use-case/01-private-workspace.puml) | [SVG](../uml/img/01-private-workspace.svg) |
| Ca sử dụng | Workspace chung, kênh, bảng, số liệu | UC09 – UC19 | [02-shared-workspace.puml](../uml/use-case/02-shared-workspace.puml) | [SVG](../uml/img/02-shared-workspace.svg) |
| Hoạt động | Đăng ký, đăng nhập | UC01 | [uc01-sign-in.puml](../uml/activity/uc01-sign-in.puml) | [SVG](../uml/img/uc01-sign-in.svg) |
| Hoạt động | Chat, dừng, lỗi, tạo lại | UC04 | [uc04-chat.puml](../uml/activity/uc04-chat.puml) | [SVG](../uml/img/uc04-chat.svg) |
| Hoạt động | Dựng ngữ cảnh nhóm, tóm tắt tin cũ | UC06 | [uc06-group-context.puml](../uml/activity/uc06-group-context.puml) | [SVG](../uml/img/uc06-group-context.svg) |
| Hoạt động | Gửi highlight riêng vào kênh | UC07 | [uc07-send-highlight.puml](../uml/activity/uc07-send-highlight.puml) | [SVG](../uml/img/uc07-send-highlight.svg) |
| Hoạt động | Xin tham gia và duyệt | UC10, UC11 | [uc10-uc11-join.puml](../uml/activity/uc10-uc11-join.puml) | [SVG](../uml/img/uc10-uc11-join.svg) |
| Hoạt động | Gửi tin và xử lý lệnh | UC12 | [uc12-channel-command.puml](../uml/activity/uc12-channel-command.puml) | [SVG](../uml/img/uc12-channel-command.svg) |
| Hoạt động | Highlight cho agent | UC13 | [uc13-agent-highlight.puml](../uml/activity/uc13-agent-highlight.puml) | [SVG](../uml/img/uc13-agent-highlight.svg) |
| Hoạt động | Nhập lượt chạy | UC16 | [uc16-import-run.puml](../uml/activity/uc16-import-run.puml) | [SVG](../uml/img/uc16-import-run.svg) |
| Tuần tự | Kiểm và lưu API key | UC03 | [uc03-api-key.puml](../uml/sequence/uc03-api-key.puml) | [SVG](../uml/img/uc03-api-key.svg) |
| Tuần tự | Chat có ngữ cảnh nhóm | UC04, UC06 | [uc04-uc06-chat-with-context.puml](../uml/sequence/uc04-uc06-chat-with-context.puml) | [SVG](../uml/img/uc04-uc06-chat-with-context.svg) |
| Tuần tự | Gửi highlight riêng vào kênh | UC07 | [uc07-send-highlight.puml](../uml/sequence/uc07-send-highlight.puml) | [SVG](../uml/img/uc07-send-highlight.svg) |
| Tuần tự | Xin tham gia và duyệt | UC10, UC11 | [uc10-uc11-join.puml](../uml/sequence/uc10-uc11-join.puml) | [SVG](../uml/img/uc10-uc11-join.svg) |
| Tuần tự | Highlight cho agent, agent đọc kèm người nói | UC13 | [uc13-agent-highlight.puml](../uml/sequence/uc13-agent-highlight.puml) | [SVG](../uml/img/uc13-agent-highlight.svg) |
| Tuần tự | /summarize và /brief | UC15 | [uc15-summarize-brief.puml](../uml/sequence/uc15-summarize-brief.puml) | [SVG](../uml/img/uc15-summarize-brief.svg) |
| Tuần tự | Chạy thử trên web | UC17 | [uc17-trial-run.puml](../uml/sequence/uc17-trial-run.puml) | [SVG](../uml/img/uc17-trial-run.svg) |
| Trạng thái | Một ý trên bảng ý tưởng | UC14 | [board-item.puml](../uml/state/board-item.puml) | [SVG](../uml/img/board-item.svg) |
| Trạng thái | Yêu cầu tham gia | UC10, UC11 | [join-request.puml](../uml/state/join-request.puml) | [SVG](../uml/img/join-request.svg) |
| Trạng thái | Lượt chạy | UC16, UC17 | [trial-run.puml](../uml/state/trial-run.puml) | [SVG](../uml/img/trial-run.svg) |
| Trạng thái | Kết nối của trình duyệt | UC20 | [connection.puml](../uml/state/connection.puml) | [SVG](../uml/img/connection.svg) |
