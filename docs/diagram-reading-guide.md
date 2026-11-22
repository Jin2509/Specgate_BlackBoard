# Hướng dẫn đọc biểu đồ UML của SpecGate

Tài liệu giải thích cách đọc các biểu đồ trong [SRS](SRS.md) và thư mục [`uml/`](../uml/README.md): mỗi loại biểu đồ trả lời câu hỏi gì, từng ký hiệu nghĩa là gì, và biểu đồ ứng với luồng trong SRS ra sao.

## 1. Nguyên tắc chung

- **Luồng nào biểu đồ nấy.** Trong mục 4 của SRS, mỗi phần luồng (mỗi ca không chia phần, hoặc mỗi Phần A, B, C của một ca) có ngay bên dưới một **biểu đồ hoạt động** và một **biểu đồ tuần tự** vẽ đúng phần luồng đó. Ca có thực thể mang vòng đời có thêm một **biểu đồ trạng thái** ở cuối ca.
- **Cùng mã ở mọi nơi.** Một bước mang cùng mã trong chữ của SRS và trên cả hai biểu đồ. Thấy `[A.E1]` ở đâu thì tìm dòng **A.E1** trong SRS để đọc chi tiết.
- **Tên tệp nói lên vị trí.** `uc04b-regenerate.puml` là UC04 phần B; ảnh tương ứng là `act-uc04b.svg` (hoạt động) và `seq-uc04b.svg` (tuần tự). Ca không chia phần không có chữ cái: `act-uc09.svg`.
- **Hình thức.** Chữ Times New Roman, cỡ 14 (tiêu đề 18, nhãn và ghi chú 13), chỉ đen và trắng. Nghĩa nằm ở hình dạng ký hiệu và ở chữ, không ở màu.

## 2. Mã luồng

| Ký hiệu | Nghĩa | Ví dụ |
| --- | --- | --- |
| `(3)` | Bước 3 của luồng chính trong phần đang xét | `(3) Bấm một nút` |
| `[A1]`, `[E2]` | Luồng thay thế A1, ngoại lệ E2 của ca không chia phần | UC09 `[E2] Không cho tạo` |
| `[B.A3]`, `[A.E1]` | Luồng thay thế A3 của phần B, ngoại lệ E1 của phần A | UC01 `[A.E1] Báo "Bạn đã hủy đăng nhập"` |
| `A.E1 - khách hủy` | Cùng mã, trên nhãn khung `alt`/`opt` của biểu đồ tuần tự | UC01 phần A |
| `UC07`, `UC14 phần A` | Chuyển sang ca hoặc phần khác, đọc tiếp ở đó | UC12 |
| `BR-23`, `FR-54` | Quy tắc nghiệp vụ, yêu cầu chức năng trong SRS | ghi chú |

## 3. Biểu đồ hoạt động (ảnh `act-…`)

**Trả lời câu hỏi:** trong phần luồng này, ai làm gì, theo thứ tự nào, rẽ nhánh ở đâu.

| Ký hiệu | Hình dạng | Nghĩa |
| --- | --- | --- |
| Làn | cột có tên ở đầu | Ai thực hiện các hộp trong cột: tác nhân (Khách, Người dùng, Thành viên, Chủ workspace), Hệ thống (SpecGate), hoặc hệ thống ngoài (Google/GitHub, Máy chủ gửi thư, Nhà cung cấp AI) |
| Điểm bắt đầu | chấm tròn đen | Nơi luồng bắt đầu |
| Điểm kết thúc | chấm đen có vòng ngoài | Luồng dừng: xong việc, hoặc dừng vì ngoại lệ |
| Hoạt động | hộp bo góc | Một bước, mở đầu bằng mã luồng |
| Quyết định | hình thoi có câu hỏi | Rẽ nhánh; chữ trên nhánh là câu trả lời |
| Gộp nhánh | hình thoi rỗng | Các nhánh nhập lại rồi đi tiếp |
| Vòng lặp | mũi tên quay ngược | Lặp tới khi điều kiện ở hình thoi cuối sai |
| Mũi tên qua làn | mũi tên từ cột này sang cột khác | Việc chuyển từ người này sang người khác hoặc sang hệ thống |
| Ghi chú | hộp gấp góc | Luồng thay thế hoặc quy tắc không cần vẽ thành nhánh riêng |

**Cách đọc:** bắt đầu từ chấm đen, đi theo mũi tên. Các hộp `(1)`, `(2)`, `(3)`… nối tiếp nhau là luồng chính. Ở mỗi hình thoi, nhánh dẫn tới hộp `(n)` kế tiếp là đường chính; nhánh còn lại dẫn tới hộp `[…A…]` (thường đi tiếp) hoặc `[…E…]` (thường dừng).

**Ví dụ: `act-uc09` (Tạo workspace chung)**

| Trên biểu đồ | Trong SRS |
| --- | --- |
| Làn Người dùng: `Bấm "Tạo mới"` → làn Hệ thống: `(1) Mở hộp thoại` | Kích hoạt và bước 1 |
| Làn Người dùng: `(2) Nhập tên, đề bài…`, `(3) Bấm "Tạo workspace"` | Bước 2, 3 |
| Hình thoi "Thiếu tên hoặc đề bài?" → `[E1]` rồi kết thúc | Ngoại lệ E1 |
| Hình thoi "Trùng tên…?" → `[E2]`; "Đã làm chủ ~10…?" → `[E3]` | Ngoại lệ E2, E3 |
| Nhánh "hợp lệ" → `(4) Tạo workspace, kênh "chung"…` | Bước 4 |

## 4. Biểu đồ tuần tự (ảnh `seq-…`)

**Trả lời câu hỏi:** cùng phần luồng đó, những đối tượng nào trong phần mềm trao đổi với nhau, theo thứ tự nào. Biểu đồ theo mô hình **Boundary – Control – Entity**.

| Ký hiệu đầu cột | Loại | Trong SpecGate là |
| --- | --- | --- |
| Hình người | Tác nhân | Người dùng thao tác |
| Hình tròn có vạch đứng bên trái | Boundary (giao diện) | Một màn hình hoặc hộp thoại của `web_ui`: "Màn hình chat", "Trang Bảng ý tưởng"… |
| Hình tròn có mũi tên vòng | Control (điều khiển) | Bộ điều khiển hoặc dịch vụ của backend: `ConversationController`, `BoardService`, `ContextBuilder`, `LlmGateway`, `Broker` (phát tin thời gian thực)… |
| Hình tròn có gạch dưới | Entity (thực thể) | Một bảng dữ liệu: `User`, `Message`, `BoardItem`… (xem `cls-domain`) |
| Hộp chữ nhật | Hệ thống ngoài | Google/GitHub, Máy chủ gửi thư, Nhà cung cấp AI |

| Ký hiệu trong thân | Nghĩa |
| --- | --- |
| Số đậm trước tin nhắn | Thứ tự tin nhắn trong biểu đồ (1, 2, 3…), không phải số bước của luồng; số bước của SRS nằm trong chữ, dạng `(3)` |
| Mũi tên liền | Một yêu cầu. Từ Boundary tới Control là lời gọi API thật, ví dụ `POST /conversations/{id}/turns`; từ Control tới Entity là thao tác dữ liệu, ví dụ `lưu câu hỏi` |
| Mũi tên đứt | Phản hồi; có thể kèm mã HTTP: `201` tạo xong, `400` dữ liệu sai, `403` không có quyền, `404` không tìm thấy, `409` xung đột trạng thái |
| Mũi tên quay về chính cột | Đối tượng tự xử lý, ví dụ `ký state` |
| Khung `alt` | Các trường hợp loại trừ nhau, ngăn bằng nét đứt; nhãn mỗi ngăn là điều kiện kèm mã luồng (`A.E1 - khách hủy`) |
| Khung `opt` | Đoạn chỉ xảy ra khi điều kiện đúng |
| Khung `loop` | Đoạn lặp lại, ví dụ nhận từng phần câu trả lời của agent |
| Khung `ref` | Tham chiếu sang biểu đồ của ca khác |
| Ghi chú | Quy tắc hoặc giải thích |

**Cách đọc:** đọc từ trên xuống. Tin nhắn đầu tiên luôn từ tác nhân tới một Boundary; Boundary gọi một Control qua API; Control đọc, ghi các Entity hoặc gọi hệ thống ngoài; phản hồi đi ngược lại. Mỗi khung `alt` trả lời câu hỏi "nếu … thì sao", với cùng mã luồng như trên biểu đồ hoạt động.

## 5. Biểu đồ trạng thái (ảnh `st-…`)

**Trả lời câu hỏi:** một thực thể đi qua những trạng thái nào, vì sự kiện gì.

| Ký hiệu | Nghĩa |
| --- | --- |
| Chấm tròn đen | Thực thể được tạo |
| Chấm đen có vòng ngoài | Thực thể kết thúc vòng đời |
| Hộp bo góc | Một trạng thái; dòng chữ dưới tên là điều luôn đúng khi ở trạng thái đó |
| Hộp lớn chứa hộp nhỏ | Trạng thái gồm các trạng thái con |
| Mũi tên có nhãn `sự kiện [điều kiện] / hành động` | Chuyển trạng thái: khi **sự kiện** xảy ra và **điều kiện** đúng thì chuyển, đồng thời thực hiện **hành động**; phần nào không có thì bỏ |
| Mũi tên quay về chính hộp | Sự kiện xảy ra mà trạng thái không đổi |

Biểu đồ trạng thái đặt ở cuối ca có thực thể đó: `st-email-code` (UC01), `st-provider-key` (UC03), `st-answer-turn` (UC04), `st-private-highlight` (UC05), `st-join-request` (UC11), `st-agent-highlight` (UC13), `st-board-item` (UC14), `st-member`, `st-task` (UC16), `st-connection` (UC17).

Ví dụ, trong `st-board-item`, mũi tên `"Đưa vào bàn" [người bấm là chủ]` đọc là: khi có người bấm "Đưa vào bàn", và người đó là chủ, thì ý chuyển từ Đề xuất sang Đang bàn. Không có mũi tên nào đi ra từ Đã chốt hay Đã loại ngoài mũi tên kết thúc: đó chính là BR-23 "không quay ngược".

## 6. Biểu đồ ca sử dụng, lớp và phân quyền

- **Ca sử dụng (`uc-…`)**: hình người là tác nhân (có «hệ thống» là hệ thống ngoài), elip là ca sử dụng, khung lớn là ranh giới hệ thống. Mũi tên đầu tam giác rỗng là kế thừa: Chủ workspace là một Thành viên, Thành viên là một Người dùng. Nét đứt `<<include>>` là luôn dùng, `<<extend>>` là mở rộng khi có điều kiện.
- **Lớp miền dữ liệu (`cls-domain`)**: mỗi hộp là một bảng; `str[40]` là chuỗi tối đa 40 ký tự, `?` là được để trống, `a | b` là chỉ nhận một trong các giá trị đó. Số `1`, `0..1`, `0..*` ở hai đầu đường là số lượng; hình thoi đặc là quan hệ sở hữu; nét đứt là tham chiếu bản chụp.
- **Kiến trúc (`cls-architecture`)**: khung là phần triển khai, hộp là thành phần kèm tệp mã, mũi tên liền là lời gọi trực tiếp.
- **Phân quyền (`rbac`)**: ✔ được, ✘ không, ◐ có điều kiện, – không áp dụng; số nhỏ trỏ tới chú thích dưới bảng.

## 7. Khi thay đổi luồng

1. Sửa chữ của luồng trong mục 4 của SRS, giữ hoặc cấp mã theo đúng mẫu.
2. Sửa cả biểu đồ hoạt động và biểu đồ tuần tự của phần luồng đó trong cùng lần thay đổi; sửa biểu đồ trạng thái nếu bước đó làm đổi trạng thái của thực thể.
3. Không đặt màu hay phông chữ trong từng tệp; mọi kiểu nằm trong `uml/_style.iuml`.
4. Xuất lại ảnh theo [uml/README.md](../uml/README.md#xuất-ảnh) và kiểm tra ảnh hiện đúng trong SRS.
