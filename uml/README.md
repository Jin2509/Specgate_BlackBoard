# Sơ đồ UML của SpecGate Workspace

Mã nguồn PlantUML cho các ca sử dụng trong [SRS 0.3](../docs/SRS.md), dựa trên [flow.md](../docs/flow.md). Mỗi sơ đồ ghi mã ca sử dụng (UC), mã luồng (A, E) và quy tắc (BR) tương ứng trong SRS. Sơ đồ mô tả hành vi ở mức người dùng và hệ thống; các thành phần như "Máy chủ SpecGate", "CSDL", "Kênh thời gian thực" là vai trò logic, không ràng buộc cách cài đặt.

`_style.iuml` chứa kiểu dùng chung và được `!include` trong mọi file.

## Mục lục

| Loại | File | Nội dung | Ca sử dụng |
|---|---|---|---|
| Ca sử dụng | [use-case/00-overview.puml](use-case/00-overview.puml) | Tổng quát 20 ca | UC01 – UC20 |
| Ca sử dụng | [use-case/01-private-workspace.puml](use-case/01-private-workspace.puml) | Workspace riêng và đường riêng sang chung | UC03 – UC08 |
| Ca sử dụng | [use-case/02-shared-workspace.puml](use-case/02-shared-workspace.puml) | Workspace chung, kênh, bảng, số liệu | UC09 – UC19 |
| Hoạt động | [activity/uc01-sign-in.puml](activity/uc01-sign-in.puml) | Đăng ký, đăng nhập | UC01 |
| Hoạt động | [activity/uc04-chat.puml](activity/uc04-chat.puml) | Chat, dừng, lỗi, tạo lại | UC04 |
| Hoạt động | [activity/uc06-group-context.puml](activity/uc06-group-context.puml) | Dựng ngữ cảnh nhóm, tóm tắt tin cũ | UC06 |
| Hoạt động | [activity/uc07-send-highlight.puml](activity/uc07-send-highlight.puml) | Gửi highlight riêng vào kênh | UC07 |
| Hoạt động | [activity/uc10-uc11-join.puml](activity/uc10-uc11-join.puml) | Xin tham gia và duyệt | UC10, UC11 |
| Hoạt động | [activity/uc12-channel-command.puml](activity/uc12-channel-command.puml) | Gửi tin và xử lý lệnh | UC12 |
| Hoạt động | [activity/uc13-agent-highlight.puml](activity/uc13-agent-highlight.puml) | Highlight cho agent | UC13 |
| Hoạt động | [activity/uc16-import-run.puml](activity/uc16-import-run.puml) | Nhập lượt chạy | UC16 |
| Tuần tự | [sequence/uc03-api-key.puml](sequence/uc03-api-key.puml) | Kiểm và lưu API key | UC03 |
| Tuần tự | [sequence/uc04-uc06-chat-with-context.puml](sequence/uc04-uc06-chat-with-context.puml) | Chat có ngữ cảnh nhóm | UC04, UC06 |
| Tuần tự | [sequence/uc07-send-highlight.puml](sequence/uc07-send-highlight.puml) | Gửi highlight riêng vào kênh | UC07 |
| Tuần tự | [sequence/uc10-uc11-join.puml](sequence/uc10-uc11-join.puml) | Xin tham gia và duyệt | UC10, UC11 |
| Tuần tự | [sequence/uc13-agent-highlight.puml](sequence/uc13-agent-highlight.puml) | Highlight cho agent, agent đọc kèm người nói | UC13 |
| Tuần tự | [sequence/uc15-summarize-brief.puml](sequence/uc15-summarize-brief.puml) | /summarize và /brief | UC15 |
| Tuần tự | [sequence/uc17-trial-run.puml](sequence/uc17-trial-run.puml) | Chạy thử trên web | UC17 |
| Trạng thái | [state/board-item.puml](state/board-item.puml) | Một ý trên bảng ý tưởng | UC14 |
| Trạng thái | [state/join-request.puml](state/join-request.puml) | Yêu cầu tham gia | UC10, UC11 |
| Trạng thái | [state/trial-run.puml](state/trial-run.puml) | Lượt chạy | UC16, UC17 |
| Trạng thái | [state/connection.puml](state/connection.puml) | Kết nối của trình duyệt | UC20 |
| RBAC | [rbac/rbac.puml](rbac/rbac.puml) | Bảng phân quyền dạng ảnh | |

## Xuất ảnh

Ảnh SVG nằm trong [img/](img/). Sau khi sửa một file `.puml`, xuất lại:

```bash
# chạy trong thư mục uml/; cần Java, dùng plantuml.jar kèm extension PlantUML của VS Code
java -jar ~/.vscode/extensions/jebbs.plantuml-*/plantuml.jar -charset UTF-8 -tsvg -o ../img \
  use-case/*.puml activity/uc*.puml sequence/uc*.puml state/*.puml rbac/*.puml
```

Hoặc dùng extension PlantUML trong VS Code (Alt+D để xem trước).

## Sơ đồ ca sử dụng

### UC01 – UC20: Tổng quát 20 ca

![Tổng quát 20 ca](img/00-overview.svg)

### UC03 – UC08: Workspace riêng và đường riêng sang chung

![Workspace riêng và đường riêng sang chung](img/01-private-workspace.svg)

### UC09 – UC19: Workspace chung, kênh, bảng, số liệu

![Workspace chung, kênh, bảng, số liệu](img/02-shared-workspace.svg)

## Sơ đồ hoạt động

### UC01: Đăng ký, đăng nhập

![Đăng ký, đăng nhập](img/uc01-sign-in.svg)

### UC04: Chat, dừng, lỗi, tạo lại

![Chat, dừng, lỗi, tạo lại](img/uc04-chat.svg)

### UC06: Dựng ngữ cảnh nhóm, tóm tắt tin cũ

![Dựng ngữ cảnh nhóm, tóm tắt tin cũ](img/uc06-group-context.svg)

### UC07: Gửi highlight riêng vào kênh

![Gửi highlight riêng vào kênh](img/uc07-send-highlight.svg)

### UC10, UC11: Xin tham gia và duyệt

![Xin tham gia và duyệt](img/uc10-uc11-join.svg)

### UC12: Gửi tin và xử lý lệnh

![Gửi tin và xử lý lệnh](img/uc12-channel-command.svg)

### UC13: Highlight cho agent

![Highlight cho agent](img/uc13-agent-highlight.svg)

### UC16: Nhập lượt chạy

![Nhập lượt chạy](img/uc16-import-run.svg)

## Sơ đồ tuần tự

### UC03: Kiểm và lưu API key

![Kiểm và lưu API key](img/uc03-api-key.svg)

### UC04, UC06: Chat có ngữ cảnh nhóm

![Chat có ngữ cảnh nhóm](img/uc04-uc06-chat-with-context.svg)

### UC07: Gửi highlight riêng vào kênh

![Gửi highlight riêng vào kênh](img/uc07-send-highlight.svg)

### UC10, UC11: Xin tham gia và duyệt

![Xin tham gia và duyệt](img/uc10-uc11-join.svg)

### UC13: Highlight cho agent, agent đọc kèm người nói

![Highlight cho agent, agent đọc kèm người nói](img/uc13-agent-highlight.svg)

### UC15: /summarize và /brief

![/summarize và /brief](img/uc15-summarize-brief.svg)

### UC17: Chạy thử trên web

![Chạy thử trên web](img/uc17-trial-run.svg)

## Sơ đồ trạng thái

### UC14: Một ý trên bảng ý tưởng

![Một ý trên bảng ý tưởng](img/board-item.svg)

### UC10, UC11: Yêu cầu tham gia

![Yêu cầu tham gia](img/join-request.svg)

### UC16, UC17: Lượt chạy

![Lượt chạy](img/trial-run.svg)

### UC20: Kết nối của trình duyệt

![Kết nối của trình duyệt](img/connection.svg)

## Sơ đồ RBAC

![RBAC](img/rbac.svg)

## Bảng RBAC

### Vai trò

| Vai trò | Định nghĩa | Kiểm ở đâu |
|---|---|---|
| **Khách** | Chưa đăng nhập | `proxy.ts` chuyển về `/login?next=…` |
| **Người dùng** | Đã đăng nhập, là chủ workspace riêng của mình, chưa thuộc workspace chung đang xét | phiên Supabase Auth |
| **Người xin** | Người dùng có `JoinRequest(status=pending)` với workspace đang xét | `getPendingRequest` |
| **Thành viên** | `Membership(role=member)` của workspace chung | `isMember`, RLS |
| **Chủ WS** | `Membership(role=owner)`, đồng thời là `ownerId` | `isOwner`, RLS |
| **Agent riêng** | Mô hình một người chọn ở workspace riêng, chạy bằng key của người đó. Không tự hành động trong kênh: chỉ chạy khi chủ nó hỏi ở workspace riêng, và tin chỉ vào kênh khi chủ nó gửi | `require_conversation_owner`, ContextBuilder |

Vai trò tính **theo từng workspace**: một người có thể là chủ workspace này và là thành viên ở workspace khác. Chủ WS có mọi quyền của Thành viên.

### Ma trận quyền

✔ được · ✘ không · ◐ có điều kiện · – không áp dụng

| Nhóm | Quyền | Khách | Người dùng | Người xin | Thành viên | Chủ WS | Agent riêng |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Tài khoản | Đăng nhập / đăng ký Google, GitHub | ✔ | – | – | – | – | ✘ |
| Tài khoản | Đăng xuất | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Lưu / đổi / xóa API key của mình (tạo agent riêng) | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Xem key gốc (chỉ thấy 4 ký tự cuối) | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| WS riêng | Chat, xem, xóa hội thoại của mình | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Xem hội thoại riêng của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| WS riêng | Gắn hội thoại với workspace chung | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| WS riêng | Gửi câu trả lời của agent mình vào kênh | ✘ | ✘ | ✘ | ✔ | ✔ | ◐⁶ |
| WS chung | Tạo workspace chung (thành chủ) | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS chung | Xem kênh, bảng, bản tổng hợp | ✘ | ✘ | ✘ | ✔ | ✔ | ◐¹ |
| WS chung | Xem thành viên, vai, agent riêng (không thấy key) | ✘ | ✘ | ✘ | ✔ | ✔ | ◐¹ |
| WS chung | Đặt vai trong nhóm của mình | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| WS chung | Sửa vai của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| WS chung | Sửa đề bài, tên, hiển thị ở Khám phá | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| WS chung | Xóa thành viên | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Tham gia | Xem và chia sẻ mã tham gia | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Tham gia | Đổi mã (mã cũ hết hiệu lực ngay) | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Tham gia | Nhập mã / gửi yêu cầu từ Khám phá | ✘ | ✔ | ✔² | ✘³ | ✘³ | ✘ |
| Tham gia | Hủy yêu cầu của mình | ✘ | ✘ | ✔ | ✘ | ✘ | ✘ |
| Tham gia | Xem, duyệt, từ chối yêu cầu | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Kênh | Gửi tin, @ nhắc người | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Kênh | Highlight tin của người khác (chỉ mình thấy) | ✘ | ✘ | ✘ | ✔⁴ | ✔⁴ | ✘ |
| Kênh | Xem highlight của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| Kênh | /idea /note /pin /help | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Kênh | /summarize /brief | ✘ | ✘ | ✘ | ✘⁵ | ✔ | ✘ |
| Bảng | Thêm ý lên bảng (cột Đề xuất) | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Bảng | Chốt / loại (bắt buộc lý do) | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Bảng | Mở lại ý đã chốt / loại | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| Tổng hợp | Dựng lại bản tổng hợp | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Tổng hợp | Tải bản tổng hợp Markdown | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Chi phí | Gọi mô hình bằng key của chủ agent | – | – | – | – | – | ◐⁷ |
| ADOM | Xem lượt chạy, chỉ số; /stats /task | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| ADOM | Nhập báo cáo, /run | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |

1. Agent riêng chỉ "đọc" qua ContextBuilder khi chủ nó hỏi trong hội thoại gắn workspace: đề bài, đội và vai, ý chốt/loại, tin của chủ nó, highlight của chủ nó kèm người nói.
2. Gửi lại thì cập nhật yêu cầu đang chờ, không tạo trùng.
3. Đã là thành viên thì mở thẳng workspace.
4. Chỉ trên tin của người khác hoặc agent người khác; tin của mình và agent mình đã tự vào ngữ cảnh.
5. Hệ thống trả tin từ chối kèm lý do.
6. Agent không tự đăng: tin chỉ vào kênh khi chủ của nó bấm "Gửi vào kênh"; lệnh trong tin của agent không thực thi; agent không chốt được.
7. Mọi lời gọi chạy bằng key của chủ agent; /summarize dùng agent và key của chủ workspace. Không có trần chi phí.

### Ghi chú cài đặt

- API: `require_member(ws)` / `require_owner(ws)` là dependency FastAPI; RLS của Postgres chặn thêm ở tầng dữ liệu.
- Các mục đã có kiểm quyền trong mock: đổi mã, duyệt yêu cầu, gửi tin, `/summarize` `/brief`, gắn hội thoại với workspace, gửi câu trả lời vào kênh, highlight (chặn tin của mình, chỉ thành viên), đặt vai trong nhóm, trang Yêu cầu tham gia, dựng lại bản tổng hợp.
- Các mục chưa có trong mock (sửa đề bài, xóa thành viên, nhập báo cáo ADOM) là quyền đề xuất, cần chốt khi làm backend.
