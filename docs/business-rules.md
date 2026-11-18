# Quy tắc nghiệp vụ (Business Rules)

## cho SpecGate Workspace (Sàng Ý), bản phát hành 1

Phiên bản 1.0, bản duyệt
Người lập: Nhóm SpecGate
Ngày 18/11/2026

## Lịch sử sửa đổi

| Người sửa | Ngày | Lý do thay đổi | Phiên bản |
| --- | --- | --- | --- |
| Nhóm SpecGate | 13/11/2026 | Bản nháp đầu, cùng SRS 0.2 | 1.0 nháp 1 |
| Nhóm SpecGate | 18/11/2026 | Theo `flow.md` đã chốt; thêm BR-26 – BR-33 cho các giới hạn và quy tắc tính toán | 1.0 bản duyệt |

## Quy ước

| Cột | Ý nghĩa |
| --- | --- |
| Mã | Mã quy tắc, dùng chung với [SRS](SRS.md) mục 6, [Use Cases](use-cases.md) và các biểu đồ trong `uml/` |
| Loại | **Fact** (sự thật về nghiệp vụ), **Constraint** (ràng buộc giới hạn hành động), **Action Enabler** (khi điều kiện đúng thì hệ thống làm một việc), **Inference** (từ điều kiện suy ra một kết luận mới), **Computation** (công thức tính hay quy tắc tạo giá trị) |
| Tĩnh hay động | **Static**: ít khi đổi; **Dynamic**: có thể đổi theo quyết định của nhóm hoặc cấu hình máy chủ |
| Nguồn | Mục của `flow.md`, điều khoản bên ngoài, hoặc quyết định của nhóm |

## Danh sách quy tắc

| Mã | Định nghĩa quy tắc | Loại | Tĩnh hay động | Nguồn |
| --- | --- | --- | --- | --- |
| BR-01 | Tài khoản chỉ tạo bằng Google hoặc GitHub; mỗi tài khoản Google hoặc GitHub ứng với đúng một tài khoản SpecGate. | Constraint | Static | `flow.md` §1 |
| BR-02 | Không có chế độ khách; không có đường dẫn cho người chưa là thành viên vào thẳng một workspace chung. | Constraint | Static | `flow.md` §1, §8 |
| BR-03 | Trang chủ chỉ có thanh bên, hình minh họa, câu chào và vài nút chức năng; thông báo nằm ở thanh bên, không nằm ở Trang chủ. | Constraint | Static | `flow.md` §2 |
| BR-04 | Mỗi người có đúng một key và một agent; agent chat ở workspace riêng và agent mang tên người đó trong kênh là một. | Fact | Static | `flow.md` §3, phần "Agent riêng làm được gì" |
| BR-05 | Key được lưu mã hóa; chỉ hiện 4 ký tự cuối; không ai xem lại được key đầy đủ, kể cả chủ key; không ai thấy key của người khác. | Constraint | Static | `flow.md` §3; chính sách bảo mật của nhóm |
| BR-06 | Mọi lời gọi mô hình chạy bằng key của chủ agent và tính tiền vào key đó. | Constraint | Static | `flow.md` §3 |
| BR-07 | Chỉ chủ hội thoại mở được hội thoại; người khác đoán đường dẫn chỉ nhận "không tìm thấy". | Constraint | Static | `flow.md` §4 |
| BR-08 | Highlight riêng chỉ người tạo thấy; không tự vào kênh hay ngữ cảnh agent; màu không đi theo khi gửi vào nhóm. | Constraint | Static | `flow.md` §4 |
| BR-09 | Highlight riêng chỉ bị xóa khi chính người dùng xóa; giữ nguyên khi đổi key, đổi mô hình, tạo lại câu trả lời; khi xóa hội thoại thì hỏi giữ hay xóa, mặc định giữ. | Constraint | Static | `flow.md` §4 "Khi nào highlight riêng bị xóa" |
| BR-10 | Mỗi hội thoại lấy ngữ cảnh từ tối đa một workspace chung tại một thời điểm; ngữ cảnh được lấy mới ở mỗi câu hỏi. | Constraint | Static | `flow.md` §5 |
| BR-11 | Agent chỉ đọc tin của người khác qua highlight cho agent của chủ nó; được nhắc tên trong kênh không làm tin lọt vào ngữ cảnh. | Constraint | Static | `flow.md` §5, §10 |
| BR-12 | Mọi đoạn trích ghi đúng mức trung thực: trọn câu giữ nhãn gốc; cắt giữa câu có dấu "…" và ghi "trích một phần"; xóa hoặc sửa chữ ở giữa ghi "(‹tên› đã chỉnh)". | Inference | Static | `flow.md` §6 "Đoạn đã chỉnh được ghi rõ" |
| BR-13 | Thẻ trong kênh, highlight và thẻ trên bảng là bản chụp; sửa hay xóa nguồn sau đó không làm đổi bản chụp. | Fact | Static | `flow.md` §6, §10 |
| BR-14 | Bản tóm tắt kênh (`/summarize`) không tính là tin của chủ workspace và không tự vào ngữ cảnh agent của bất kỳ ai. | Constraint | Static | `flow.md` §5, §12 |
| BR-15 | Lưu lại, xem lại, rồi mới gửi: mọi thứ từ workspace riêng vào kênh phải đi qua danh sách Highlight riêng; chỉ chủ agent gửi được lời agent của mình; tin giữ tên mô hình lúc gửi. | Constraint | Static | `flow.md` §6 |
| BR-16 | Không gửi nguyên văn cả hội thoại riêng vào kênh và không xuất hội thoại riêng ra tệp. | Constraint | Static | `flow.md` §6, "Những gì website không làm" |
| BR-17 | Workspace chung không có agent của riêng nó và không có agent trọng tài tự động. | Fact | Static | `flow.md` §7 |
| BR-18 | Cả hai đường vào workspace (mã tham gia, trang Khám phá) đều phải chờ chủ duyệt; đổi mã làm mã cũ hết hiệu lực ngay. | Constraint | Static | `flow.md` §8 |
| BR-19 | Không agent nào tự trả lời trong kênh; không agent nào gọi agent khác. | Constraint | Static | `flow.md` §9 |
| BR-20 | Lệnh trong kênh chỉ được thực hiện khi do người gõ; agent không thể tự chốt, tự loại hay tự đưa ý lên bảng. | Constraint | Static | `flow.md` §9, §11 |
| BR-21 | Chỉ chủ workspace chuyển ý từ Đề xuất sang Đang bàn. Chốt và loại hiện do mọi thành viên làm được, miễn ghi tên và lý do. | Constraint | Dynamic | `flow.md` §11; SRS điểm mở 9.3 |
| BR-22 | Highlight cho agent không sửa được chữ của người khác, chỉ thu hẹp hai đầu hoặc bỏ đoạn; mỗi đoạn giữ người nói và tin gốc riêng; chưa phải quyết định của nhóm và không tự lên bảng. | Constraint | Static | `flow.md` §10 |
| BR-23 | Chốt và loại ý bắt buộc có lý do, chỉ con người làm, và không quay ngược được. | Constraint | Static | `flow.md` §11 |
| BR-24 | `/summarize` và `/brief` là quyền của chủ workspace; `/summarize` chỉ đọc đề bài và tin của chính kênh đó. | Constraint | Static | `flow.md` §12 |
| BR-25 | Tên trong workspace là duy nhất và giữ chỗ mãi cho người đã dùng; người đã rời hiện "‹tên› (đã rời)"; khi được duyệt mà tên trùng thì hệ thống đặt tên tạm và yêu cầu đặt biệt danh; người cũ vào lại lấy lại tên cũ. | Action Enabler | Static | `flow.md` §8, §13 |
| BR-26 | Phiên đăng nhập được nhớ 30 ngày trên trình duyệt và tính lại từ đầu mỗi lần người dùng quay lại. | Fact | Dynamic | `flow.md` §1 |
| BR-27 | Mã tham gia gồm 7 ký tự chữ in hoa và số, không dùng ký tự dễ nhầm (O, 0, I, L, 1); khi nhập, chữ thường, dấu cách và gạch nối được chuẩn hóa trước khi so. | Computation | Static | `flow.md` §8 |
| BR-28 | Giới hạn số lượng: mỗi người tối đa khoảng 200 highlight riêng; tối đa khoảng 30 highlight cho agent trong mỗi workspace; làm chủ tối đa khoảng 10 workspace chung. Khi chạm giới hạn, hệ thống không tự xóa mà nhắc người dùng tự dọn. | Constraint | Dynamic | `flow.md` §4, §7, §10; điểm mở 6 |
| BR-29 | Ngữ cảnh nhóm gửi nguyên văn khoảng 50 tin gần nhất của người hỏi. Khi tóm tắt tin cũ: chia khối tại mốc giờ của từng highlight xen giữa; khối dưới khoảng 5 tin giữ nguyên văn; mọi khối còn lại tóm tắt trong một lần gọi agent; tối đa khoảng 31 khối. | Computation | Dynamic | `flow.md` §5 |
| BR-30 | Tên agent ở mọi nơi là "‹mô hình› của ‹tên trong workspace›", ví dụ "Claude của Lan"; tin cũ giữ tên mô hình tại lúc gửi. | Computation | Static | `flow.md` §5, §6, §13 |
| BR-31 | Người nói của đoạn lấy từ bản tóm tắt là "Bản tóm tắt do ‹agent› viết (chưa lọc)" (tóm tắt hội thoại) hoặc "Bản tóm tắt kênh do ‹agent› viết (chưa lọc)" (tóm tắt kênh); đoạn lấy từ lượt gốc đính kèm giữ người nói của lượt đó. | Inference | Static | `flow.md` §6, §12 |
| BR-32 | Vai trong nhóm và tên trong workspace dài tối đa 40 ký tự; mỗi người chỉ sửa được vai và tên của chính mình; màu ảnh đại diện không trùng giữa các thành viên trong cùng workspace. | Constraint | Static | `flow.md` §9, §13 |
| BR-33 | Bản tóm tắt hội thoại cho nhóm đính kèm tối đa 4 lượt hỏi đáp gốc. | Constraint | Dynamic | `flow.md` §6 |

## Truy vết quy tắc và ca sử dụng

| Quy tắc | Ca sử dụng áp dụng |
| --- | --- |
| BR-01, BR-02, BR-26 | UC01 |
| BR-03 | UC02 |
| BR-04, BR-05 | UC03 |
| BR-06, BR-07, BR-09, BR-13 | UC04 |
| BR-08, BR-09, BR-12, BR-28 | UC05 |
| BR-06, BR-10, BR-11, BR-14, BR-29 | UC06 |
| BR-12, BR-13, BR-15, BR-30 | UC07 |
| BR-15, BR-16, BR-31, BR-33 | UC08 |
| BR-17, BR-27, BR-28 | UC09 |
| BR-18, BR-27 | UC10 |
| BR-18, BR-25, BR-32 | UC11 |
| BR-19, BR-20 | UC12 |
| BR-11, BR-12, BR-22, BR-28, BR-31 | UC13 |
| BR-20, BR-21, BR-23, BR-31 | UC14 |
| BR-14, BR-24, BR-31 | UC15 |
| BR-17, BR-18, BR-25, BR-32 | UC16 |
| BR-26 | UC17 |
