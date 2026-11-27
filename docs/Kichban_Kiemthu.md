# Kịch bản kiểm thử

## UC01. Đăng nhập, đăng ký và đăng xuất

### TC-UC01-01. Đăng nhập bằng tài khoản có sẵn

- Nguồn: flow §1 · UC01 1.A.A4
1. Mở trang "/login"
2. Thấy nút "Tiếp tục với Google"
3. Thấy nút "Tiếp tục với GitHub"
4. Bấm "Tiếp tục với GitHub"
5. Thấy chữ "Chọn tài khoản để tiếp tục tới SpecGate"
6. Bấm "lan-pham"
7. Thấy chữ "Chào Lan, hôm nay mình sàng ý gì?"

### TC-UC01-02. Quay lại đúng trang định mở

- Nguồn: flow §1 · UC01 1.A.A2
1. Mở trang "/w/{ws}/board"
2. Thấy địa chỉ chứa "/login"
3. Bấm "Tiếp tục với GitHub"
4. Bấm "lan-pham"
5. Thấy địa chỉ chứa "/board"
6. Thấy chữ "Bảng ý tưởng"

### TC-UC01-03. Trang tạo tài khoản

- Nguồn: flow §1 · UC01 1.A
1. Mở trang "/login"
2. Bấm "Tạo tài khoản"
3. Thấy nút "Đăng ký với Google"
4. Thấy nút "Đăng ký với GitHub"
5. Không thấy chữ "Mật khẩu"

### TC-UC01-04. Đăng xuất

- Nguồn: flow §1 · UC01 1.B
1. Đăng nhập là Lan
2. Mở menu tài khoản
3. Bấm "Đăng xuất"
4. Thấy địa chỉ chứa "/login"
5. Mở trang "/"
6. Thấy địa chỉ chứa "/login"

## UC02. Dùng Trang chủ và dấu báo ở thanh bên

### TC-UC02-01. Trang chủ có đủ lựa chọn chính

- Nguồn: flow §2 · UC02 2.0
1. Đăng nhập là Lan
2. Thấy chữ "Chào Lan, hôm nay mình sàng ý gì?"
3. Thấy nút "Chat với agent của tôi"
4. Thấy nút "Vào làm việc với nhóm"
5. Thấy nút "Tạo mới"
6. Thấy nút "Nhập mã"
7. Thấy nút "Khám phá"
8. Bấm "Vào làm việc với nhóm"
9. Thấy địa chỉ chứa "/c/chung"

### TC-UC02-02. Người chưa vào nhóm nào

- Nguồn: flow §2 · UC02 2.0.A2
1. Đăng nhập là Trang
2. Thấy nút "Tìm nhóm để tham gia"
3. Bấm "Tìm nhóm để tham gia"
4. Thấy chữ "Tìm nhóm cùng nghĩ"

### TC-UC02-03. Dấu báo tin chưa đọc tự hiện

- Nguồn: flow §2 · UC02 thông tin khác
1. **Lan:** Đăng nhập là Lan
2. **Long:** Đăng nhập là Long
3. **Long:** Mở trang "/w/{ws}/c/runner"
4. **Long:** Gõ "Mình vừa chạy xong seed 1" vào ô "Nội dung tin nhắn" rồi nhấn Enter
5. **Lan:** Thấy dấu báo "có tin mới chưa đọc"
6. **Lan:** Mở trang "/w/{ws}/c/runner"
7. **Lan:** Thấy chữ "Mình vừa chạy xong seed 1"

## UC03. Thiết lập API key và chọn mô hình

### TC-UC03-01. Thay key hợp lệ

- Nguồn: flow §3 · UC03 3.0, 3.0.A2
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Key và mô hình"
4. Thấy chữ "0001"
5. Bấm "Đổi key"
6. Điền "sk-ant-test-key-abcd1234" vào ô "API key"
7. Thấy chữ "Nhận ra key Anthropic."
8. Bấm "Kiểm và thay key"
9. Thấy chữ "1234"
10. Không thấy chữ "sk-ant-test-key-abcd1234"

### TC-UC03-02. Key bị nhà cung cấp từ chối

- Nguồn: flow §3 · UC03 3.0.E1
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Key và mô hình"
4. Bấm "Đổi key"
5. Điền "sk-ant-short" vào ô "API key"
6. Bấm "Kiểm và thay key"
7. Thấy chữ "Nhà cung cấp từ chối key này"
8. Tải lại trang
9. Thấy chữ "0001"

Bước 9: key cũ vẫn còn, key sai không được lưu.

### TC-UC03-03. Xóa key thì không chat được

- Nguồn: flow §3 · UC03 3.0.A3
1. Đăng nhập là Trang
2. Bấm "Chat với agent của tôi"
3. Bấm "Key và mô hình"
4. Bấm "Xóa key"
5. Thấy hộp thoại "Xóa API key?"
6. Bấm "Xóa" trong hộp thoại
7. Bấm "Trang chủ"
8. Thấy nút "Nhập API key để có agent"
9. Bấm "Nhập API key để có agent"
10. Bấm "Ôn tập kiểm chứng"
11. Thấy chữ "Z3 là bộ giải SMT"

Bước 8 đến 11: xóa key xong, Trang chủ đổi nút, lịch sử hội thoại vẫn còn.

## UC04. Chat với agent riêng

### TC-UC04-01. Hỏi và nhận câu trả lời

- Nguồn: flow §4 · UC04 4.A
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Hội thoại mới"
4. Gõ "Phân tích hướng A" vào ô "Câu hỏi cho agent" rồi nhấn Enter
5. Thấy chữ "Phân tích hướng A"
6. Đợi agent trả lời xong
7. Thấy chữ "Đây là câu hỏi đầu tiên của hội thoại."
8. Thấy nút "Chép"
9. Thấy nút "Tạo lại"
10. Tải lại trang
11. Thấy chữ "Đây là câu hỏi đầu tiên của hội thoại."

### TC-UC04-02. Agent nhớ lượt trước

- Nguồn: flow §4 · UC04 4.A.4
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Hội thoại mới"
4. Gõ "Câu một" vào ô "Câu hỏi cho agent" rồi nhấn Enter
5. Đợi agent trả lời xong
6. Gõ "Câu hai" vào ô "Câu hỏi cho agent" rồi nhấn Enter
7. Đợi agent trả lời xong
8. Thấy chữ "Mình vẫn giữ 1 câu hỏi trước của bạn"

### TC-UC04-03. Nhà cung cấp lỗi giữa chừng

- Nguồn: flow §4 · UC04 4.A.E1
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Hội thoại mới"
4. Gõ "Thử lỗi [fake-error]" vào ô "Câu hỏi cho agent" rồi nhấn Enter
5. Thấy chữ "Key đã hết hạn mức"
6. Thấy chữ "Thử lỗi [fake-error]"
7. Gõ "Câu sau" vào ô "Câu hỏi cho agent" rồi nhấn Enter
8. Đợi agent trả lời xong
9. Thấy chữ "Đây là câu hỏi đầu tiên của hội thoại."

Bước 9: lượt lỗi không được gửi lại cho agent, nên agent coi "Câu sau" là câu hỏi đầu tiên.

### TC-UC04-04. Tạo lại giữ câu cũ thành phiên bản

- Nguồn: flow §4 · UC04 4.B
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Thống nhất với runner"
4. Bấm "Tạo lại"
5. Đợi agent trả lời xong
6. Thấy chữ "2/2"
7. Bấm "‹"
8. Thấy chữ "1/2"
9. Thấy chữ "runner cần thống nhất"

Kịch bản này sẽ báo lỗi ở bước 6 cho tới khi website có nút chuyển phiên bản câu trả lời. Khi có nút, sửa bước 7 theo đúng nhãn của nút "phiên bản trước".

### TC-UC04-05. Xóa hội thoại, giữ lại highlight

- Nguồn: flow §4 "Khi nào highlight riêng bị xóa" · UC04 4.C.A2
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Thống nhất với runner"
4. Bôi đen "ngân sách gọi mô hình"
5. Bấm "Lưu"
6. Bấm "Xóa hội thoại"
7. Thấy hộp thoại "Xóa hội thoại này?"
8. Thấy chữ "Hội thoại có 1 highlight riêng"
9. Bấm "Giữ lại highlight" trong hộp thoại
10. Bấm "Highlight riêng"
11. Thấy chữ "ngân sách gọi mô hình"
12. Thấy chữ "hội thoại gốc đã bị xóa"

### TC-UC04-06. Người khác không mở được hội thoại

- Nguồn: flow §4 · UC04 4.C.E1
1. Đăng nhập là Lan
2. Mở trang "/w/{ws-rieng-cua-trang}/chat/{hoi-thoai-cua-trang}"
3. Thấy chữ "Không tìm thấy"
4. Không thấy chữ "Z3 là bộ giải SMT"

`{ws-rieng-cua-trang}` và `{hoi-thoai-cua-trang}` là id của workspace riêng và hội thoại "Ôn tập kiểm chứng" của Trang, đọc từ cơ sở dữ liệu sau khi nạp dữ liệu mẫu.

## UC05. Highlight riêng

### TC-UC05-01. Lưu highlight riêng

- Nguồn: flow §4 "Highlight riêng trong hội thoại" · UC05 5.A
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Thống nhất với runner"
4. Bôi đen "1. bộ dữ liệu, 2. số seed"
5. Bấm "Màu hồng"
6. Bấm "Thêm ghi chú"
7. Điền "hỏi lại runner" vào ô "Ghi chú ngắn, ví dụ: hỏi lại nhóm"
8. Bấm "Lưu"
9. Thấy chữ "Đã lưu vào Highlight riêng. Chưa có gì được gửi vào nhóm."
10. Mở trang "/w/{ws}/c/chung"
11. Không thấy chữ "hỏi lại runner"

Bước 10, 11: highlight riêng không tự vào kênh.

### TC-UC05-02. Lọc danh sách theo màu

- Nguồn: flow §4 · UC05 5.B
1. Thực hiện TC-UC05-01 đến bước 9
2. Bôi đen "ngân sách gọi mô hình"
3. Bấm "Màu vàng"
4. Bấm "Lưu"
5. Bấm "Highlight riêng"
6. Chọn "hồng" ở ô "Lọc theo màu"
7. Thấy chữ "1. bộ dữ liệu, 2. số seed"
8. Không thấy chữ "ngân sách gọi mô hình"

### TC-UC05-03. Xóa highlight không làm mất thẻ đã gửi

- Nguồn: flow §4, §6 · UC05 5.B.A2
1. Thực hiện TC-UC07-01
2. Bấm "Highlight riêng"
3. Bấm "Xóa (thẻ đã gửi vào kênh vẫn còn)"
4. Bấm "Xóa" trong hộp thoại
5. Không thấy chữ "1. bộ dữ liệu, 2. số seed"
6. Mở trang "/w/{ws}/c/chung"
7. Thấy chữ "Mọi người xem đoạn này giúp mình"

## UC06. Ngữ cảnh nhóm cho hội thoại

### TC-UC06-01. Chọn ngữ cảnh nhóm

- Nguồn: flow §5 · UC06 6.A
1. Đăng nhập là Long
2. Bấm "Chat với agent của tôi"
3. Bấm "Hội thoại mới"
4. Chọn "Đồ án Kiểm chứng" ở ô "Ngữ cảnh nhóm"
5. Thấy chữ "Agent đang đọc: Đồ án Kiểm chứng"
6. Thấy chữ "Runner"
7. Thấy chữ "1 ý đã chốt, 1 ý đã loại"
8. Gõ "Nên làm gì tiếp?" vào ô "Câu hỏi cho agent" rồi nhấn Enter
9. Đợi agent trả lời xong
10. Thấy chữ "Mình đã đọc ngữ cảnh nhóm"

### TC-UC06-02. Bỏ ngữ cảnh nhóm

- Nguồn: flow §5 · UC06 6.A.A1
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Thống nhất với runner"
4. Thấy chữ "Agent đang đọc: Đồ án Kiểm chứng"
5. Chọn "Không gắn" ở ô "Ngữ cảnh nhóm"
6. Không thấy chữ "Agent đang đọc"
7. Gõ "Câu không ngữ cảnh" vào ô "Câu hỏi cho agent" rồi nhấn Enter
8. Đợi agent trả lời xong
9. Không thấy chữ "Mình đã đọc ngữ cảnh nhóm"

## UC07. Gửi highlight riêng vào kênh

### TC-UC07-01. Gửi từ danh sách Highlight riêng

- Nguồn: flow §6 "Cách thứ nhất" · UC07 7.A
1. Thực hiện TC-UC05-01 đến bước 9
2. Bấm "Highlight riêng"
3. Đánh dấu "Chọn highlight này"
4. Bấm "Gửi vào nhóm"
5. Chọn "Đồ án Kiểm chứng" ở ô "Workspace chung"
6. Chọn "chung" ở ô "Kênh"
7. Điền "Mọi người xem đoạn này giúp mình" vào ô "Lời của bạn (tùy chọn)"
8. Bấm "Gửi" trong hộp thoại
9. Thấy chữ "Đã gửi vào #chung"
10. Bấm "Mở kênh"
11. Thấy chữ "Mọi người xem đoạn này giúp mình"
12. Thấy chữ "của Lan nói"
13. Thấy chữ "1. bộ dữ liệu, 2. số seed"

### TC-UC07-02. Gửi lại vào đúng kênh đã gửi

- Nguồn: flow §6 · UC07 7.A.A1
1. Thực hiện TC-UC07-01
2. Bấm "Highlight riêng"
3. Đánh dấu "Chọn highlight này"
4. Bấm "Gửi vào nhóm"
5. Chọn "Đồ án Kiểm chứng" ở ô "Workspace chung"
6. Chọn "chung" ở ô "Kênh"
7. Thấy chữ "Highlight này đã được gửi vào #chung trước đó."
8. Bấm "Vẫn gửi lại" trong hộp thoại
9. Thấy chữ "Đã gửi vào #chung"

### TC-UC07-03. Chèn highlight bằng @ trong kênh

- Nguồn: flow §6 "Đường thứ hai" · UC07 7.B
1. Thực hiện TC-UC05-01 đến bước 9
2. Mở trang "/w/{ws}/c/chung"
3. Gõ "@" vào ô "Nội dung tin nhắn"
4. Thấy chữ "Highlight của tôi"
5. Bấm "Highlight của tôi"
6. Bấm "1. bộ dữ liệu, 2. số seed"
7. Gõ "Long ơi, nhờ bạn xem giúp" vào ô "Nội dung tin nhắn" rồi nhấn Enter
8. Thấy chữ "Long ơi, nhờ bạn xem giúp"
9. Thấy chữ "của Lan nói"

## UC08. Tóm tắt hội thoại cho nhóm

### TC-UC08-01. Tóm tắt cho nhóm lưu vào Highlight riêng

- Nguồn: flow §6 "Cách thứ hai" · UC08 8.0
1. Đăng nhập là Lan
2. Bấm "Chat với agent của tôi"
3. Bấm "Thống nhất với runner"
4. Bấm "Tóm tắt cho nhóm"
5. Thấy chữ "Đã có bản tóm tắt"
6. Bấm "Highlight riêng"
7. Thấy chữ "bản tóm tắt"
8. Mở trang "/w/{ws}/c/chung"
9. Không thấy chữ "Tóm tắt hội thoại của Lan"

Bước 8, 9: bản tóm tắt chưa vào kênh khi người dùng chưa bấm gửi.

## UC09. Tạo workspace chung

### TC-UC09-01. Tạo workspace

- Nguồn: flow §7 · UC09 9.0
1. Đăng nhập là Trang
2. Bấm "Tạo mới"
3. Thấy hộp thoại "Tạo workspace chung"
4. Điền "Nhóm thử nghiệm" vào ô "Tên"
5. Điền "Chọn công cụ kiểm thử cho đồ án" vào ô "Đề bài"
6. Chọn "Ai cũng tìm thấy, vào phải xin" ở ô "Ai tìm thấy workspace này"
7. Bấm "Tạo workspace" trong hộp thoại
8. Thấy địa chỉ chứa "/c/chung"
9. Thấy chữ "Nhóm thử nghiệm"
10. Bấm "Chia sẻ mã tham gia"
11. Thấy chữ "Mời người khác vào Nhóm thử nghiệm"

### TC-UC09-02. Thiếu đề bài thì không tạo được

- Nguồn: flow §7 · UC09 9.0.E1
1. Đăng nhập là Trang
2. Bấm "Tạo mới"
3. Điền "Nhóm thiếu đề bài" vào ô "Tên"
4. Bấm "Tạo workspace" trong hộp thoại
5. Thấy hộp thoại "Tạo workspace chung"
6. Tải lại trang
7. Không thấy chữ "Nhóm thiếu đề bài"

## UC10. Xin tham gia workspace chung

### TC-UC10-01. Xin vào bằng mã và được duyệt

- Nguồn: flow §8 · UC10 10.A, UC11 11.0
1. **Trang:** Đăng nhập là Trang
2. **Trang:** Bấm "Nhập mã"
3. **Trang:** Điền "kc26 dax" vào ô "Mã tham gia"
4. **Trang:** Bấm "Tham gia" trong hộp thoại
5. **Trang:** Thấy chữ "Đang chờ duyệt"
6. **Lan:** Đăng nhập là Lan
7. **Lan:** Mở trang "/w/{ws}/requests"
8. **Lan:** Thấy chữ "xin tham gia"
9. **Lan:** Bấm "Duyệt"
10. **Trang:** Thấy địa chỉ chứa "/w/{ws}/c/chung"

Bước 3 nhập chữ thường có dấu cách để kiểm hệ thống tự chuẩn hóa mã. Bước 10 không tải lại trang: trang chờ tự kiểm mỗi 3 giây rồi chuyển, nên bước này đặt thời gian chờ 10 giây.

### TC-UC10-02. Mã sai

- Nguồn: flow §8 · UC10 10.A.E1
1. Đăng nhập là Trang
2. Bấm "Nhập mã"
3. Điền "ZZZZZZZ" vào ô "Mã tham gia"
4. Bấm "Tham gia" trong hộp thoại
5. Thấy chữ "Không tìm thấy workspace với mã này"
6. Không thấy chữ "Đang chờ duyệt"

### TC-UC10-03. Xin vào qua Khám phá

- Nguồn: flow §8 · UC10 10.B
1. Đăng nhập là Trang
2. Bấm "Khám phá"
3. Điền "Kiểm chứng" vào ô "Tìm workspace"
4. Bấm "Xin vào Đồ án Kiểm chứng"
5. Điền "Mình làm phần đánh giá" vào ô "Lời nhắn cho chủ workspace"
6. Bấm "Gửi yêu cầu"
7. Thấy chữ "Đang chờ duyệt"
8. Thấy chữ "Từ trang Khám phá"

## UC11. Duyệt yêu cầu tham gia

Duyệt yêu cầu đã có trong TC-UC10-01.

### TC-UC11-01. Từ chối yêu cầu

- Nguồn: flow §8 · UC11 11.0, UC10 10.A.E2
1. **Trang:** Thực hiện TC-UC10-01 đến bước 5
2. **Lan:** Đăng nhập là Lan
3. **Lan:** Mở trang "/w/{ws}/requests"
4. **Lan:** Bấm "Từ chối"
5. **Lan:** Thấy chữ "Đã xử lý"
6. **Trang:** Thấy chữ "Yêu cầu bị từ chối"
7. **Trang:** Thấy nút "Về workspace riêng"

### TC-UC11-02. Chỉ chủ mở được trang yêu cầu

- Nguồn: flow §8 · UC11 11.0.E2
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/requests"
3. Thấy địa chỉ chứa "/c/chung"
4. Không thấy nút "Duyệt"

## UC12. Nhắn tin trong kênh

### TC-UC12-01. Tin hiện ngay cho người khác

- Nguồn: flow §9 · UC12 12.0
1. **Lan:** Đăng nhập là Lan
2. **Lan:** Mở trang "/w/{ws}/c/chung"
3. **Long:** Đăng nhập là Long
4. **Long:** Mở trang "/w/{ws}/c/chung"
5. **Long:** Gõ "Mình đã chạy xong seed 2" vào ô "Nội dung tin nhắn" rồi nhấn Enter
6. **Lan:** Thấy chữ "Mình đã chạy xong seed 2"

Bước 6 đặt thời gian chờ 2 giây (NFR-06), không tải lại trang.

### TC-UC12-02. Gõ / để xem lệnh

- Nguồn: flow §9 · UC12 12.0.1
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Gõ "/" vào ô "Nội dung tin nhắn"
4. Thấy chữ "Ghi một ý lên bảng"
5. Thấy chữ "Chốt hoặc loại một ý, kèm lý do"
6. Thấy chữ "Tạo việc đứng tên bạn"
7. Thấy chữ "Danh sách lệnh"

### TC-UC12-03. Lệnh của chủ do thành viên gõ

- Nguồn: flow §12 · UC12 12.0.A2, UC15 15.A.E1
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Gõ "/summarize" vào ô "Nội dung tin nhắn" rồi nhấn Enter
4. Thấy chữ "quyền của chủ workspace"
5. Không thấy chữ "Tóm tắt kênh, từ /summarize"

## UC13. Highlight cho agent

### TC-UC13-01. Highlight tin của người khác cho agent

- Nguồn: flow §10 · UC13 13.0
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Bôi đen "1. bộ dữ liệu, 2. số seed"
4. Bấm "Highlight cho agent của tôi"
5. Thấy hộp thoại "Highlight cho agent của bạn"
6. Thấy chữ "của Lan"
7. Chọn "Quan trọng" ở ô "Nhãn highlight"
8. Bấm "Lưu highlight" trong hộp thoại
9. Thấy chữ "Đã lưu highlight. Agent của bạn đọc nó ở lượt hỏi tiếp theo."
10. Bấm "Chat với agent của tôi"
11. Bấm "Highlight cho agent"
12. Thấy chữ "1. bộ dữ liệu, 2. số seed"

### TC-UC13-02. Tin của mình không cần highlight

- Nguồn: flow §10 · UC13 13.0.A1
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Bôi đen "nên giữ 20% tác vụ làm holdout"
4. Thấy chữ "Tin của bạn đã tự vào ngữ cảnh agent của bạn"
5. Không thấy nút "Highlight cho agent của tôi"

## UC14. Quản lý bảng ý tưởng

### TC-UC14-01. Thêm ý bằng /idea

- Nguồn: flow §11 · UC14 14.A
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Gõ "/idea Tách bước kiểm tra thành hai giai đoạn" vào ô "Nội dung tin nhắn" rồi nhấn Enter
4. Thấy chữ "#5 ở"
5. Mở trang "/w/{ws}/board"
6. Thấy chữ "Tách bước kiểm tra thành hai giai đoạn"

Bước 4: tin hệ thống báo ý mới là #5, vì dữ liệu mẫu đã có 4 mục. Ý mới nằm ở cột Đề xuất.

### TC-UC14-02. Chỉ chủ chuyển ý sang Đang bàn

- Nguồn: flow §11 · UC14 14.B, 14.B.E1
1. **Long:** Thực hiện TC-UC14-01
2. **Long:** Không thấy nút "Chuyển sang Đang bàn"
3. **Lan:** Đăng nhập là Lan
4. **Lan:** Mở trang "/w/{ws}/board"
5. **Lan:** Bấm "Chuyển sang Đang bàn"
6. **Lan:** Tải lại trang
7. **Lan:** Không thấy nút "Chuyển sang Đang bàn"

Bước 7: ý #5 là ý duy nhất ở cột Đề xuất, nên sau khi chuyển thì không còn nút này.

### TC-UC14-03. Chốt ý bắt buộc có lý do

- Nguồn: flow §11 · UC14 14.C, 14.C.E1
1. Đăng nhập là Lan
2. Mở trang "/w/{ws}/board"
3. Bấm "Chốt"
4. Thấy hộp thoại "Chốt hay loại ý này"
5. Thấy chữ "Tương đương lệnh"
6. Nút "Chốt ý này" bị khóa
7. Điền "Đủ thời gian trong 3 tuần" vào ô "Lý do"
8. Bấm "Chốt ý này" trong hộp thoại
9. Thấy chữ "Đủ thời gian trong 3 tuần"
10. Mở trang "/w/{ws}/c/chung"
11. Thấy chữ "Đủ thời gian trong 3 tuần"

Bước 3 là nút "Chốt" của ý #3 "Giữ 20% holdout", ý duy nhất đang bàn trong dữ liệu mẫu. Bước 11: kênh có tin hệ thống ghi quyết định.

### TC-UC14-04. /decide thiếu lý do không chạy

- Nguồn: flow "Các lệnh gõ trong kênh" · UC14 14.C.E1
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Gõ "/decide 3 chốt" vào ô "Nội dung tin nhắn" rồi nhấn Enter
4. Thấy chữ "lý do"
5. Mở trang "/w/{ws}/board"
6. Thấy nút "Chốt"

Bước 6: ý #3 vẫn ở Đang bàn nên vẫn còn nút "Chốt".

## UC15. Tóm tắt kênh và bản tổng hợp

### TC-UC15-01. Chủ dựng và tải bản tổng hợp

- Nguồn: flow §12 · UC15 15.B
1. Đăng nhập là Lan
2. Mở trang "/w/{ws}/brief"
3. Bấm "Dựng"
4. Thấy chữ "Dùng HumanEval+ làm bộ dữ liệu chính"
5. Thấy chữ "Có sẵn bộ kiểm thử mạnh"
6. Thấy chữ "Viết lại bằng Coq"
7. Thấy chữ "Quá nặng cho 3 tuần"
8. Thấy chữ "Giữ 20% holdout"
9. Thấy chữ "Hạn nộp 30/11"
10. Tải về tệp "ban-tong-hop.md" khi bấm "Tải Markdown"

### TC-UC15-02. Thành viên không dựng được

- Nguồn: flow §12 · UC15 15.B.E1, 15.B.A1
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/brief"
3. Thấy chữ "Chủ workspace dựng bản tổng hợp"
4. Không thấy nút "Dựng"
5. Mở trang "/w/{ws}/c/chung"
6. Gõ "/brief" vào ô "Nội dung tin nhắn" rồi nhấn Enter
7. Thấy chữ "quyền của chủ workspace"

## UC16. Thành viên và cài đặt workspace

### TC-UC16-01. Chủ sửa đề bài

- Nguồn: flow §13 · UC16 16.B
1. Đăng nhập là Lan
2. Mở trang "/w/{ws}/settings"
3. Điền "Chọn đề tài đồ án: công cụ kiểm chứng trên HumanEval+ và MBPP" vào ô "Đề bài"
4. Bấm "Lưu đề bài"
5. Thấy chữ "Đã lưu."
6. Tải lại trang
7. Ô "Đề bài" có giá trị "Chọn đề tài đồ án: công cụ kiểm chứng trên HumanEval+ và MBPP"

### TC-UC16-02. Thành viên chỉ xem đề bài

- Nguồn: flow §13 · UC16 16.B.E3
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/settings"
3. Thấy chữ "Chỉ chủ workspace sửa được đề bài."
4. Không thấy nút "Lưu đề bài"
5. Không thấy nút "Đổi mã"

### TC-UC16-03. Thêm việc và nhận việc

- Nguồn: flow §13 "Bảng phân công" · UC16 16.C
1. **Lan:** Đăng nhập là Lan
2. **Lan:** Mở trang "/w/{ws}/tasks"
3. **Lan:** Gõ "Tìm ý tưởng đề tài" vào ô "Thêm việc lớn, ví dụ: tìm ý tưởng đề tài" rồi nhấn Enter
4. **Lan:** Thấy chữ "việc 1"
5. **Lan:** Bấm "Tác vụ với việc 1"
6. **Lan:** Bấm "Sửa việc 1"
7. **Lan:** Chọn "Chưa có người phụ trách" ở ô "Người phụ trách"
8. **Lan:** Bấm "Lưu" trong hộp thoại
9. **Long:** Đăng nhập là Long
10. **Long:** Mở trang "/w/{ws}/tasks"
11. **Long:** Bấm "Nhận"
12. **Long:** Thấy chữ "1 việc của bạn"
13. **Long:** Mở trang "/w/{ws}/c/chung"
14. **Long:** Thấy chữ "Tìm ý tưởng đề tài"

Bước 5 đến 8: việc chủ tạo mặc định đứng tên chủ, nên chủ bỏ người phụ trách để Long nhận. Bước 14: kênh "chung" có tin hệ thống về việc mới.

### TC-UC16-04. Khóa bảng phân công

- Nguồn: flow §13 · UC16 16.C.A8, 16.C.E1
1. **Lan:** Thực hiện TC-UC16-03 đến bước 4
2. **Lan:** Bấm "Khóa bảng"
3. **Lan:** Thấy chữ "Bảng đang khóa."
4. **Long:** Đăng nhập là Long
5. **Long:** Mở trang "/w/{ws}/c/chung"
6. **Long:** Gõ "/task Việc khi bảng khóa" vào ô "Nội dung tin nhắn" rồi nhấn Enter
7. **Long:** Mở trang "/w/{ws}/tasks"
8. **Long:** Không thấy chữ "Việc khi bảng khóa"
9. **Lan:** Bấm "Mở khóa"
10. **Lan:** Không thấy chữ "Bảng đang khóa."

### TC-UC16-05. Thành viên rời workspace

- Nguồn: flow §13 · UC16 16.A.A4
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/settings"
3. Bấm "Rời workspace"
4. Thấy hộp thoại "Rời workspace này?"
5. Bấm "Rời workspace" trong hộp thoại
6. Mở trang "/w/{ws}/c/chung"
7. Thấy chữ "Bạn chưa là thành viên của"

## UC17. Tiếp tục làm việc khi mạng chập chờn

### TC-UC17-01. Mất mạng không mất chữ đang soạn

- Nguồn: flow §14 · UC17 17.0
1. Đăng nhập là Long
2. Mở trang "/w/{ws}/c/chung"
3. Ngắt mạng
4. Thấy chữ "Mất kết nối, đang thử kết nối lại."
5. Điền "Mình nghĩ nên thêm seed" vào ô "Nội dung tin nhắn"
6. Bật mạng
7. Không thấy chữ "Mất kết nối, đang thử kết nối lại."
8. Ô "Nội dung tin nhắn" có giá trị "Mình nghĩ nên thêm seed"

