# Biểu đồ UML của SpecGate Workspace

Mã nguồn PlantUML cho các ca sử dụng trong [SRS 0.4](../docs/SRS.md), dựa trên [flow.md](../docs/flow.md) và mã đang chạy trong `backend/`, `web_ui/`. Cách đọc đầy đủ: [docs/diagram-reading-guide.md](../docs/diagram-reading-guide.md).

- **Mỗi phần luồng có một cặp biểu đồ.** Mỗi ca không chia phần, và mỗi Phần A, B, C của ca có chia phần, có đúng một biểu đồ hoạt động (`act-`) và một biểu đồ tuần tự (`seq-`). Tên tệp mang mã ca và chữ của phần: `uc04b-…` là UC04 phần B.
- **Biểu đồ hoạt động** chia làn theo tác nhân, Hệ thống và hệ thống ngoài; mỗi hộp mở đầu bằng mã luồng của SRS: `(3)` bước của luồng chính, `[A.E1]` luồng thay thế hoặc ngoại lệ.
- **Biểu đồ tuần tự** theo mô hình Boundary – Control – Entity: màn hình của `web_ui`, bộ điều khiển và dịch vụ của backend, thực thể là bảng trong CSDL; tin nhắn đánh số, khung `alt`/`opt`/`loop` ghi mã luồng.
- **Biểu đồ trạng thái** (`st-`) cho các thực thể có vòng đời, chuyển trạng thái ghi `sự kiện [điều kiện] / hành động`.
- Mọi biểu đồ dùng `_style.iuml`: chữ Times New Roman, cỡ 14 (tiêu đề 18), chỉ đen và trắng.

## Mục lục

| Loại | Tên biểu đồ | Mã nguồn | Ảnh |
|---|---|---|---|
| Ca sử dụng | Sơ đồ ca sử dụng tổng quát (SRS 0.4) | [00-overview.puml](use-case/00-overview.puml) | [SVG](img/uc-00-overview.svg) |
| Ca sử dụng | Ca sử dụng chi tiết: workspace riêng và đường riêng sang chung | [01-private-workspace.puml](use-case/01-private-workspace.puml) | [SVG](img/uc-01-private-workspace.svg) |
| Ca sử dụng | Ca sử dụng chi tiết: workspace chung, kênh và bảng | [02-shared-workspace.puml](use-case/02-shared-workspace.puml) | [SVG](img/uc-02-shared-workspace.svg) |
| Hoạt động | Biểu đồ hoạt động UC01 - Phần A: Đăng ký hoặc đăng nhập | [uc01a-sign-in.puml](activity/uc01a-sign-in.puml) | [SVG](img/act-uc01a.svg) |
| Hoạt động | Biểu đồ hoạt động UC01 - Phần B: Đăng xuất | [uc01b-sign-out.puml](activity/uc01b-sign-out.puml) | [SVG](img/act-uc01b.svg) |
| Hoạt động | Biểu đồ hoạt động UC01 - Phần C: Đăng nhập bằng mã gửi qua email | [uc01c-email-sign-in.puml](activity/uc01c-email-sign-in.puml) | [SVG](img/act-uc01c.svg) |
| Hoạt động | Biểu đồ hoạt động UC02: Dùng Trang chủ và dấu báo ở thanh bên | [uc02-home-badges.puml](activity/uc02-home-badges.puml) | [SVG](img/act-uc02.svg) |
| Hoạt động | Biểu đồ hoạt động UC03: Thiết lập API key và chọn mô hình | [uc03-api-key.puml](activity/uc03-api-key.puml) | [SVG](img/act-uc03.svg) |
| Hoạt động | Biểu đồ hoạt động UC04 - Phần A: Chat với agent riêng | [uc04a-chat.puml](activity/uc04a-chat.puml) | [SVG](img/act-uc04a.svg) |
| Hoạt động | Biểu đồ hoạt động UC04 - Phần B: Tạo lại câu trả lời | [uc04b-regenerate.puml](activity/uc04b-regenerate.puml) | [SVG](img/act-uc04b.svg) |
| Hoạt động | Biểu đồ hoạt động UC04 - Phần C: Quản lý hội thoại | [uc04c-manage-conversations.puml](activity/uc04c-manage-conversations.puml) | [SVG](img/act-uc04c.svg) |
| Hoạt động | Biểu đồ hoạt động UC05 - Phần A: Tạo highlight riêng | [uc05a-create-private-highlight.puml](activity/uc05a-create-private-highlight.puml) | [SVG](img/act-uc05a.svg) |
| Hoạt động | Biểu đồ hoạt động UC05 - Phần B: Quản lý danh sách Highlight riêng | [uc05b-manage-private-highlights.puml](activity/uc05b-manage-private-highlights.puml) | [SVG](img/act-uc05b.svg) |
| Hoạt động | Biểu đồ hoạt động UC06 - Phần A: Chọn ngữ cảnh nhóm cho hội thoại | [uc06a-choose-context.puml](activity/uc06a-choose-context.puml) | [SVG](img/act-uc06a.svg) |
| Hoạt động | Biểu đồ hoạt động UC06 - Phần B: Tóm tắt tin cũ của tôi | [uc06b-digest.puml](activity/uc06b-digest.puml) | [SVG](img/act-uc06b.svg) |
| Hoạt động | Biểu đồ hoạt động UC07 - Phần A: Gửi highlight riêng từ danh sách | [uc07a-send-from-list.puml](activity/uc07a-send-from-list.puml) | [SVG](img/act-uc07a.svg) |
| Hoạt động | Biểu đồ hoạt động UC07 - Phần B: Chèn highlight riêng bằng @ | [uc07b-insert-with-mention.puml](activity/uc07b-insert-with-mention.puml) | [SVG](img/act-uc07b.svg) |
| Hoạt động | Biểu đồ hoạt động UC08: Tóm tắt hội thoại cho nhóm | [uc08-conversation-summary.puml](activity/uc08-conversation-summary.puml) | [SVG](img/act-uc08.svg) |
| Hoạt động | Biểu đồ hoạt động UC09: Tạo workspace chung | [uc09-create-workspace.puml](activity/uc09-create-workspace.puml) | [SVG](img/act-uc09.svg) |
| Hoạt động | Biểu đồ hoạt động UC10 - Phần A: Xin tham gia bằng mã | [uc10a-join-with-code.puml](activity/uc10a-join-with-code.puml) | [SVG](img/act-uc10a.svg) |
| Hoạt động | Biểu đồ hoạt động UC10 - Phần B: Xin tham gia qua trang Khám phá | [uc10b-join-from-explore.puml](activity/uc10b-join-from-explore.puml) | [SVG](img/act-uc10b.svg) |
| Hoạt động | Biểu đồ hoạt động UC11: Duyệt yêu cầu tham gia | [uc11-approve.puml](activity/uc11-approve.puml) | [SVG](img/act-uc11.svg) |
| Hoạt động | Biểu đồ hoạt động UC12: Nhắn tin trong kênh | [uc12-channel-command.puml](activity/uc12-channel-command.puml) | [SVG](img/act-uc12.svg) |
| Hoạt động | Biểu đồ hoạt động UC13: Highlight cho agent | [uc13-agent-highlight.puml](activity/uc13-agent-highlight.puml) | [SVG](img/act-uc13.svg) |
| Hoạt động | Biểu đồ hoạt động UC14 - Phần A: Đưa ý lên bảng ý tưởng | [uc14a-add-idea.puml](activity/uc14a-add-idea.puml) | [SVG](img/act-uc14a.svg) |
| Hoạt động | Biểu đồ hoạt động UC14 - Phần B: Chuyển ý sang Đang bàn | [uc14b-discuss.puml](activity/uc14b-discuss.puml) | [SVG](img/act-uc14b.svg) |
| Hoạt động | Biểu đồ hoạt động UC14 - Phần C: Chốt hoặc loại ý | [uc14c-decide.puml](activity/uc14c-decide.puml) | [SVG](img/act-uc14c.svg) |
| Hoạt động | Biểu đồ hoạt động UC15 - Phần A: Tóm tắt kênh (/summarize) | [uc15a-summarize.puml](activity/uc15a-summarize.puml) | [SVG](img/act-uc15a.svg) |
| Hoạt động | Biểu đồ hoạt động UC15 - Phần B: Dựng và tải bản tổng hợp (/brief) | [uc15b-brief.puml](activity/uc15b-brief.puml) | [SVG](img/act-uc15b.svg) |
| Hoạt động | Biểu đồ hoạt động UC16 - Phần A: Quản lý tên, vai và tư cách thành viên | [uc16a-members.puml](activity/uc16a-members.puml) | [SVG](img/act-uc16a.svg) |
| Hoạt động | Biểu đồ hoạt động UC16 - Phần B: Cấu hình workspace chung | [uc16b-settings.puml](activity/uc16b-settings.puml) | [SVG](img/act-uc16b.svg) |
| Hoạt động | Biểu đồ hoạt động UC16 - Phần C: Bảng phân công | [uc16c-task-board.puml](activity/uc16c-task-board.puml) | [SVG](img/act-uc16c.svg) |
| Hoạt động | Biểu đồ hoạt động UC17: Tiếp tục làm việc khi mạng chập chờn | [uc17-connection.puml](activity/uc17-connection.puml) | [SVG](img/act-uc17.svg) |
| Tuần tự | Biểu đồ tuần tự UC01 - Phần A: Đăng ký hoặc đăng nhập | [uc01a-sign-in.puml](sequence/uc01a-sign-in.puml) | [SVG](img/seq-uc01a.svg) |
| Tuần tự | Biểu đồ tuần tự UC01 - Phần B: Đăng xuất | [uc01b-sign-out.puml](sequence/uc01b-sign-out.puml) | [SVG](img/seq-uc01b.svg) |
| Tuần tự | Biểu đồ tuần tự UC01 - Phần C: Đăng nhập bằng mã gửi qua email | [uc01c-email-sign-in.puml](sequence/uc01c-email-sign-in.puml) | [SVG](img/seq-uc01c.svg) |
| Tuần tự | Biểu đồ tuần tự UC02: Dùng Trang chủ và dấu báo ở thanh bên | [uc02-home.puml](sequence/uc02-home.puml) | [SVG](img/seq-uc02.svg) |
| Tuần tự | Biểu đồ tuần tự UC03: Thiết lập API key và chọn mô hình | [uc03-api-key.puml](sequence/uc03-api-key.puml) | [SVG](img/seq-uc03.svg) |
| Tuần tự | Biểu đồ tuần tự UC04 - Phần A: Chat với agent riêng | [uc04a-chat.puml](sequence/uc04a-chat.puml) | [SVG](img/seq-uc04a.svg) |
| Tuần tự | Biểu đồ tuần tự UC04 - Phần B: Tạo lại câu trả lời | [uc04b-regenerate.puml](sequence/uc04b-regenerate.puml) | [SVG](img/seq-uc04b.svg) |
| Tuần tự | Biểu đồ tuần tự UC04 - Phần C: Quản lý hội thoại | [uc04c-manage-conversations.puml](sequence/uc04c-manage-conversations.puml) | [SVG](img/seq-uc04c.svg) |
| Tuần tự | Biểu đồ tuần tự UC05 - Phần A: Tạo highlight riêng | [uc05a-create-private-highlight.puml](sequence/uc05a-create-private-highlight.puml) | [SVG](img/seq-uc05a.svg) |
| Tuần tự | Biểu đồ tuần tự UC05 - Phần B: Quản lý danh sách Highlight riêng | [uc05b-manage-private-highlights.puml](sequence/uc05b-manage-private-highlights.puml) | [SVG](img/seq-uc05b.svg) |
| Tuần tự | Biểu đồ tuần tự UC06 - Phần A: Chọn ngữ cảnh nhóm cho hội thoại | [uc06a-choose-context.puml](sequence/uc06a-choose-context.puml) | [SVG](img/seq-uc06a.svg) |
| Tuần tự | Biểu đồ tuần tự UC06 - Phần B: Tóm tắt tin cũ của tôi | [uc06b-digest.puml](sequence/uc06b-digest.puml) | [SVG](img/seq-uc06b.svg) |
| Tuần tự | Biểu đồ tuần tự UC07 - Phần A: Gửi highlight riêng từ danh sách | [uc07a-send-from-list.puml](sequence/uc07a-send-from-list.puml) | [SVG](img/seq-uc07a.svg) |
| Tuần tự | Biểu đồ tuần tự UC07 - Phần B: Chèn highlight riêng bằng @ | [uc07b-insert-with-mention.puml](sequence/uc07b-insert-with-mention.puml) | [SVG](img/seq-uc07b.svg) |
| Tuần tự | Biểu đồ tuần tự UC08: Tóm tắt hội thoại cho nhóm | [uc08-conversation-summary.puml](sequence/uc08-conversation-summary.puml) | [SVG](img/seq-uc08.svg) |
| Tuần tự | Biểu đồ tuần tự UC09: Tạo workspace chung | [uc09-create-workspace.puml](sequence/uc09-create-workspace.puml) | [SVG](img/seq-uc09.svg) |
| Tuần tự | Biểu đồ tuần tự UC10 - Phần A: Xin tham gia bằng mã | [uc10a-join-with-code.puml](sequence/uc10a-join-with-code.puml) | [SVG](img/seq-uc10a.svg) |
| Tuần tự | Biểu đồ tuần tự UC10 - Phần B: Xin tham gia qua trang Khám phá | [uc10b-join-from-explore.puml](sequence/uc10b-join-from-explore.puml) | [SVG](img/seq-uc10b.svg) |
| Tuần tự | Biểu đồ tuần tự UC11: Duyệt yêu cầu tham gia | [uc11-approve.puml](sequence/uc11-approve.puml) | [SVG](img/seq-uc11.svg) |
| Tuần tự | Biểu đồ tuần tự UC12: Nhắn tin trong kênh | [uc12-channel-command.puml](sequence/uc12-channel-command.puml) | [SVG](img/seq-uc12.svg) |
| Tuần tự | Biểu đồ tuần tự UC13: Highlight cho agent | [uc13-agent-highlight.puml](sequence/uc13-agent-highlight.puml) | [SVG](img/seq-uc13.svg) |
| Tuần tự | Biểu đồ tuần tự UC14 - Phần A: Đưa ý lên bảng ý tưởng | [uc14a-add-idea.puml](sequence/uc14a-add-idea.puml) | [SVG](img/seq-uc14a.svg) |
| Tuần tự | Biểu đồ tuần tự UC14 - Phần B: Chuyển ý sang Đang bàn | [uc14b-discuss.puml](sequence/uc14b-discuss.puml) | [SVG](img/seq-uc14b.svg) |
| Tuần tự | Biểu đồ tuần tự UC14 - Phần C: Chốt hoặc loại ý | [uc14c-decide.puml](sequence/uc14c-decide.puml) | [SVG](img/seq-uc14c.svg) |
| Tuần tự | Biểu đồ tuần tự UC15 - Phần A: Tóm tắt kênh (/summarize) | [uc15a-summarize.puml](sequence/uc15a-summarize.puml) | [SVG](img/seq-uc15a.svg) |
| Tuần tự | Biểu đồ tuần tự UC15 - Phần B: Dựng và tải bản tổng hợp (/brief) | [uc15b-brief.puml](sequence/uc15b-brief.puml) | [SVG](img/seq-uc15b.svg) |
| Tuần tự | Biểu đồ tuần tự UC16 - Phần A: Quản lý tên, vai và tư cách thành viên | [uc16a-members.puml](sequence/uc16a-members.puml) | [SVG](img/seq-uc16a.svg) |
| Tuần tự | Biểu đồ tuần tự UC16 - Phần B: Cấu hình workspace chung | [uc16b-settings.puml](sequence/uc16b-settings.puml) | [SVG](img/seq-uc16b.svg) |
| Tuần tự | Biểu đồ tuần tự UC16 - Phần C: Bảng phân công | [uc16c-task-board.puml](sequence/uc16c-task-board.puml) | [SVG](img/seq-uc16c.svg) |
| Tuần tự | Biểu đồ tuần tự UC17: Tiếp tục làm việc khi mạng chập chờn | [uc17-connection.puml](sequence/uc17-connection.puml) | [SVG](img/seq-uc17.svg) |
| Trạng thái | Biểu đồ trạng thái: Highlight cho agent (Highlight) | [agent-highlight.puml](state/agent-highlight.puml) | [SVG](img/st-agent-highlight.svg) |
| Trạng thái | Biểu đồ trạng thái: Câu trả lời của agent (Turn) | [answer-turn.puml](state/answer-turn.puml) | [SVG](img/st-answer-turn.svg) |
| Trạng thái | Biểu đồ trạng thái: Ý trên bảng ý tưởng (BoardItem) | [board-item.puml](state/board-item.puml) | [SVG](img/st-board-item.svg) |
| Trạng thái | Biểu đồ trạng thái: Kết nối của trình duyệt | [connection.puml](state/connection.puml) | [SVG](img/st-connection.svg) |
| Trạng thái | Biểu đồ trạng thái: Mã đăng nhập gửi qua email (EmailCode) | [email-code.puml](state/email-code.puml) | [SVG](img/st-email-code.svg) |
| Trạng thái | Biểu đồ trạng thái: Yêu cầu tham gia (JoinRequest) | [join-request.puml](state/join-request.puml) | [SVG](img/st-join-request.svg) |
| Trạng thái | Biểu đồ trạng thái: Thành viên workspace (Member) | [member.puml](state/member.puml) | [SVG](img/st-member.svg) |
| Trạng thái | Biểu đồ trạng thái: Highlight riêng (PrivateHighlight) | [private-highlight.puml](state/private-highlight.puml) | [SVG](img/st-private-highlight.svg) |
| Trạng thái | Biểu đồ trạng thái: Agent riêng theo API key (ProviderKey) | [provider-key.puml](state/provider-key.puml) | [SVG](img/st-provider-key.svg) |
| Trạng thái | Biểu đồ trạng thái: Việc trên bảng phân công (Task) | [task.puml](state/task.puml) | [SVG](img/st-task.svg) |
| Lớp | SpecGate: kiến trúc thành phần (web_ui → backend → CSDL) | [architecture.puml](class/architecture.puml) | [SVG](img/cls-architecture.svg) |
| Lớp | SpecGate: sơ đồ lớp miền dữ liệu (bảng ws_* trong backend) | [domain.puml](class/domain.puml) | [SVG](img/cls-domain.svg) |
| Tầm nhìn | Cây tính năng SpecGate Workspace | [feature-tree.puml](vision/feature-tree.puml) | [SVG](img/vs-feature-tree.svg) |
| Tầm nhìn | Sơ đồ ngữ cảnh SpecGate Workspace | [context-diagram.puml](vision/context-diagram.puml) | [SVG](img/vs-context-diagram.svg) |
| RBAC | Bảng RBAC SpecGate (✔ được, ✘ không, ◐ có điều kiện) | [rbac.puml](rbac/rbac.puml) | [SVG](img/rbac.svg) |

Các tệp `.puml` khác trong `activity/`, `sequence/` và ảnh không có trong bảng trên là bản cũ; SRS không dùng chúng.

## Xuất ảnh

Ảnh SVG nằm trong [img/](img/). Sau khi sửa một tệp `.puml`, xuất lại đúng tệp đó (chạy trong thư mục `uml/`, cần Java và `plantuml.jar` kèm extension PlantUML của VS Code), ví dụ:

```bash
java -jar ~/.vscode/extensions/jebbs.plantuml-*/plantuml.jar -charset UTF-8 -tsvg -o ../img activity/uc04b-regenerate.puml
```

Tên ảnh lấy theo dòng `@startuml` của tệp, ví dụ `act-uc04b.svg`.

Hoặc dùng extension PlantUML trong VS Code (Alt+D để xem trước).

## Biểu đồ ca sử dụng

### Sơ đồ ca sử dụng tổng quát (SRS 0.4)

![Sơ đồ ca sử dụng tổng quát (SRS 0.4)](img/uc-00-overview.svg)

### Ca sử dụng chi tiết: workspace riêng và đường riêng sang chung

![Ca sử dụng chi tiết: workspace riêng và đường riêng sang chung](img/uc-01-private-workspace.svg)

### Ca sử dụng chi tiết: workspace chung, kênh và bảng

![Ca sử dụng chi tiết: workspace chung, kênh và bảng](img/uc-02-shared-workspace.svg)

## Biểu đồ hoạt động

### Biểu đồ hoạt động UC01 - Phần A: Đăng ký hoặc đăng nhập

![Biểu đồ hoạt động UC01 - Phần A: Đăng ký hoặc đăng nhập](img/act-uc01a.svg)

### Biểu đồ hoạt động UC01 - Phần B: Đăng xuất

![Biểu đồ hoạt động UC01 - Phần B: Đăng xuất](img/act-uc01b.svg)

### Biểu đồ hoạt động UC01 - Phần C: Đăng nhập bằng mã gửi qua email

![Biểu đồ hoạt động UC01 - Phần C: Đăng nhập bằng mã gửi qua email](img/act-uc01c.svg)

### Biểu đồ hoạt động UC02: Dùng Trang chủ và dấu báo ở thanh bên

![Biểu đồ hoạt động UC02: Dùng Trang chủ và dấu báo ở thanh bên](img/act-uc02.svg)

### Biểu đồ hoạt động UC03: Thiết lập API key và chọn mô hình

![Biểu đồ hoạt động UC03: Thiết lập API key và chọn mô hình](img/act-uc03.svg)

### Biểu đồ hoạt động UC04 - Phần A: Chat với agent riêng

![Biểu đồ hoạt động UC04 - Phần A: Chat với agent riêng](img/act-uc04a.svg)

### Biểu đồ hoạt động UC04 - Phần B: Tạo lại câu trả lời

![Biểu đồ hoạt động UC04 - Phần B: Tạo lại câu trả lời](img/act-uc04b.svg)

### Biểu đồ hoạt động UC04 - Phần C: Quản lý hội thoại

![Biểu đồ hoạt động UC04 - Phần C: Quản lý hội thoại](img/act-uc04c.svg)

### Biểu đồ hoạt động UC05 - Phần A: Tạo highlight riêng

![Biểu đồ hoạt động UC05 - Phần A: Tạo highlight riêng](img/act-uc05a.svg)

### Biểu đồ hoạt động UC05 - Phần B: Quản lý danh sách Highlight riêng

![Biểu đồ hoạt động UC05 - Phần B: Quản lý danh sách Highlight riêng](img/act-uc05b.svg)

### Biểu đồ hoạt động UC06 - Phần A: Chọn ngữ cảnh nhóm cho hội thoại

![Biểu đồ hoạt động UC06 - Phần A: Chọn ngữ cảnh nhóm cho hội thoại](img/act-uc06a.svg)

### Biểu đồ hoạt động UC06 - Phần B: Tóm tắt tin cũ của tôi

![Biểu đồ hoạt động UC06 - Phần B: Tóm tắt tin cũ của tôi](img/act-uc06b.svg)

### Biểu đồ hoạt động UC07 - Phần A: Gửi highlight riêng từ danh sách

![Biểu đồ hoạt động UC07 - Phần A: Gửi highlight riêng từ danh sách](img/act-uc07a.svg)

### Biểu đồ hoạt động UC07 - Phần B: Chèn highlight riêng bằng @

![Biểu đồ hoạt động UC07 - Phần B: Chèn highlight riêng bằng @](img/act-uc07b.svg)

### Biểu đồ hoạt động UC08: Tóm tắt hội thoại cho nhóm

![Biểu đồ hoạt động UC08: Tóm tắt hội thoại cho nhóm](img/act-uc08.svg)

### Biểu đồ hoạt động UC09: Tạo workspace chung

![Biểu đồ hoạt động UC09: Tạo workspace chung](img/act-uc09.svg)

### Biểu đồ hoạt động UC10 - Phần A: Xin tham gia bằng mã

![Biểu đồ hoạt động UC10 - Phần A: Xin tham gia bằng mã](img/act-uc10a.svg)

### Biểu đồ hoạt động UC10 - Phần B: Xin tham gia qua trang Khám phá

![Biểu đồ hoạt động UC10 - Phần B: Xin tham gia qua trang Khám phá](img/act-uc10b.svg)

### Biểu đồ hoạt động UC11: Duyệt yêu cầu tham gia

![Biểu đồ hoạt động UC11: Duyệt yêu cầu tham gia](img/act-uc11.svg)

### Biểu đồ hoạt động UC12: Nhắn tin trong kênh

![Biểu đồ hoạt động UC12: Nhắn tin trong kênh](img/act-uc12.svg)

### Biểu đồ hoạt động UC13: Highlight cho agent

![Biểu đồ hoạt động UC13: Highlight cho agent](img/act-uc13.svg)

### Biểu đồ hoạt động UC14 - Phần A: Đưa ý lên bảng ý tưởng

![Biểu đồ hoạt động UC14 - Phần A: Đưa ý lên bảng ý tưởng](img/act-uc14a.svg)

### Biểu đồ hoạt động UC14 - Phần B: Chuyển ý sang Đang bàn

![Biểu đồ hoạt động UC14 - Phần B: Chuyển ý sang Đang bàn](img/act-uc14b.svg)

### Biểu đồ hoạt động UC14 - Phần C: Chốt hoặc loại ý

![Biểu đồ hoạt động UC14 - Phần C: Chốt hoặc loại ý](img/act-uc14c.svg)

### Biểu đồ hoạt động UC15 - Phần A: Tóm tắt kênh (/summarize)

![Biểu đồ hoạt động UC15 - Phần A: Tóm tắt kênh (/summarize)](img/act-uc15a.svg)

### Biểu đồ hoạt động UC15 - Phần B: Dựng và tải bản tổng hợp (/brief)

![Biểu đồ hoạt động UC15 - Phần B: Dựng và tải bản tổng hợp (/brief)](img/act-uc15b.svg)

### Biểu đồ hoạt động UC16 - Phần A: Quản lý tên, vai và tư cách thành viên

![Biểu đồ hoạt động UC16 - Phần A: Quản lý tên, vai và tư cách thành viên](img/act-uc16a.svg)

### Biểu đồ hoạt động UC16 - Phần B: Cấu hình workspace chung

![Biểu đồ hoạt động UC16 - Phần B: Cấu hình workspace chung](img/act-uc16b.svg)

### Biểu đồ hoạt động UC16 - Phần C: Bảng phân công

![Biểu đồ hoạt động UC16 - Phần C: Bảng phân công](img/act-uc16c.svg)

### Biểu đồ hoạt động UC17: Tiếp tục làm việc khi mạng chập chờn

![Biểu đồ hoạt động UC17: Tiếp tục làm việc khi mạng chập chờn](img/act-uc17.svg)

## Biểu đồ tuần tự

### Biểu đồ tuần tự UC01 - Phần A: Đăng ký hoặc đăng nhập

![Biểu đồ tuần tự UC01 - Phần A: Đăng ký hoặc đăng nhập](img/seq-uc01a.svg)

### Biểu đồ tuần tự UC01 - Phần B: Đăng xuất

![Biểu đồ tuần tự UC01 - Phần B: Đăng xuất](img/seq-uc01b.svg)

### Biểu đồ tuần tự UC01 - Phần C: Đăng nhập bằng mã gửi qua email

![Biểu đồ tuần tự UC01 - Phần C: Đăng nhập bằng mã gửi qua email](img/seq-uc01c.svg)

### Biểu đồ tuần tự UC02: Dùng Trang chủ và dấu báo ở thanh bên

![Biểu đồ tuần tự UC02: Dùng Trang chủ và dấu báo ở thanh bên](img/seq-uc02.svg)

### Biểu đồ tuần tự UC03: Thiết lập API key và chọn mô hình

![Biểu đồ tuần tự UC03: Thiết lập API key và chọn mô hình](img/seq-uc03.svg)

### Biểu đồ tuần tự UC04 - Phần A: Chat với agent riêng

![Biểu đồ tuần tự UC04 - Phần A: Chat với agent riêng](img/seq-uc04a.svg)

### Biểu đồ tuần tự UC04 - Phần B: Tạo lại câu trả lời

![Biểu đồ tuần tự UC04 - Phần B: Tạo lại câu trả lời](img/seq-uc04b.svg)

### Biểu đồ tuần tự UC04 - Phần C: Quản lý hội thoại

![Biểu đồ tuần tự UC04 - Phần C: Quản lý hội thoại](img/seq-uc04c.svg)

### Biểu đồ tuần tự UC05 - Phần A: Tạo highlight riêng

![Biểu đồ tuần tự UC05 - Phần A: Tạo highlight riêng](img/seq-uc05a.svg)

### Biểu đồ tuần tự UC05 - Phần B: Quản lý danh sách Highlight riêng

![Biểu đồ tuần tự UC05 - Phần B: Quản lý danh sách Highlight riêng](img/seq-uc05b.svg)

### Biểu đồ tuần tự UC06 - Phần A: Chọn ngữ cảnh nhóm cho hội thoại

![Biểu đồ tuần tự UC06 - Phần A: Chọn ngữ cảnh nhóm cho hội thoại](img/seq-uc06a.svg)

### Biểu đồ tuần tự UC06 - Phần B: Tóm tắt tin cũ của tôi

![Biểu đồ tuần tự UC06 - Phần B: Tóm tắt tin cũ của tôi](img/seq-uc06b.svg)

### Biểu đồ tuần tự UC07 - Phần A: Gửi highlight riêng từ danh sách

![Biểu đồ tuần tự UC07 - Phần A: Gửi highlight riêng từ danh sách](img/seq-uc07a.svg)

### Biểu đồ tuần tự UC07 - Phần B: Chèn highlight riêng bằng @

![Biểu đồ tuần tự UC07 - Phần B: Chèn highlight riêng bằng @](img/seq-uc07b.svg)

### Biểu đồ tuần tự UC08: Tóm tắt hội thoại cho nhóm

![Biểu đồ tuần tự UC08: Tóm tắt hội thoại cho nhóm](img/seq-uc08.svg)

### Biểu đồ tuần tự UC09: Tạo workspace chung

![Biểu đồ tuần tự UC09: Tạo workspace chung](img/seq-uc09.svg)

### Biểu đồ tuần tự UC10 - Phần A: Xin tham gia bằng mã

![Biểu đồ tuần tự UC10 - Phần A: Xin tham gia bằng mã](img/seq-uc10a.svg)

### Biểu đồ tuần tự UC10 - Phần B: Xin tham gia qua trang Khám phá

![Biểu đồ tuần tự UC10 - Phần B: Xin tham gia qua trang Khám phá](img/seq-uc10b.svg)

### Biểu đồ tuần tự UC11: Duyệt yêu cầu tham gia

![Biểu đồ tuần tự UC11: Duyệt yêu cầu tham gia](img/seq-uc11.svg)

### Biểu đồ tuần tự UC12: Nhắn tin trong kênh

![Biểu đồ tuần tự UC12: Nhắn tin trong kênh](img/seq-uc12.svg)

### Biểu đồ tuần tự UC13: Highlight cho agent

![Biểu đồ tuần tự UC13: Highlight cho agent](img/seq-uc13.svg)

### Biểu đồ tuần tự UC14 - Phần A: Đưa ý lên bảng ý tưởng

![Biểu đồ tuần tự UC14 - Phần A: Đưa ý lên bảng ý tưởng](img/seq-uc14a.svg)

### Biểu đồ tuần tự UC14 - Phần B: Chuyển ý sang Đang bàn

![Biểu đồ tuần tự UC14 - Phần B: Chuyển ý sang Đang bàn](img/seq-uc14b.svg)

### Biểu đồ tuần tự UC14 - Phần C: Chốt hoặc loại ý

![Biểu đồ tuần tự UC14 - Phần C: Chốt hoặc loại ý](img/seq-uc14c.svg)

### Biểu đồ tuần tự UC15 - Phần A: Tóm tắt kênh (/summarize)

![Biểu đồ tuần tự UC15 - Phần A: Tóm tắt kênh (/summarize)](img/seq-uc15a.svg)

### Biểu đồ tuần tự UC15 - Phần B: Dựng và tải bản tổng hợp (/brief)

![Biểu đồ tuần tự UC15 - Phần B: Dựng và tải bản tổng hợp (/brief)](img/seq-uc15b.svg)

### Biểu đồ tuần tự UC16 - Phần A: Quản lý tên, vai và tư cách thành viên

![Biểu đồ tuần tự UC16 - Phần A: Quản lý tên, vai và tư cách thành viên](img/seq-uc16a.svg)

### Biểu đồ tuần tự UC16 - Phần B: Cấu hình workspace chung

![Biểu đồ tuần tự UC16 - Phần B: Cấu hình workspace chung](img/seq-uc16b.svg)

### Biểu đồ tuần tự UC16 - Phần C: Bảng phân công

![Biểu đồ tuần tự UC16 - Phần C: Bảng phân công](img/seq-uc16c.svg)

### Biểu đồ tuần tự UC17: Tiếp tục làm việc khi mạng chập chờn

![Biểu đồ tuần tự UC17: Tiếp tục làm việc khi mạng chập chờn](img/seq-uc17.svg)

## Biểu đồ trạng thái

### Biểu đồ trạng thái: Highlight cho agent (Highlight)

![Biểu đồ trạng thái: Highlight cho agent (Highlight)](img/st-agent-highlight.svg)

### Biểu đồ trạng thái: Câu trả lời của agent (Turn)

![Biểu đồ trạng thái: Câu trả lời của agent (Turn)](img/st-answer-turn.svg)

### Biểu đồ trạng thái: Ý trên bảng ý tưởng (BoardItem)

![Biểu đồ trạng thái: Ý trên bảng ý tưởng (BoardItem)](img/st-board-item.svg)

### Biểu đồ trạng thái: Kết nối của trình duyệt

![Biểu đồ trạng thái: Kết nối của trình duyệt](img/st-connection.svg)

### Biểu đồ trạng thái: Mã đăng nhập gửi qua email (EmailCode)

![Biểu đồ trạng thái: Mã đăng nhập gửi qua email (EmailCode)](img/st-email-code.svg)

### Biểu đồ trạng thái: Yêu cầu tham gia (JoinRequest)

![Biểu đồ trạng thái: Yêu cầu tham gia (JoinRequest)](img/st-join-request.svg)

### Biểu đồ trạng thái: Thành viên workspace (Member)

![Biểu đồ trạng thái: Thành viên workspace (Member)](img/st-member.svg)

### Biểu đồ trạng thái: Highlight riêng (PrivateHighlight)

![Biểu đồ trạng thái: Highlight riêng (PrivateHighlight)](img/st-private-highlight.svg)

### Biểu đồ trạng thái: Agent riêng theo API key (ProviderKey)

![Biểu đồ trạng thái: Agent riêng theo API key (ProviderKey)](img/st-provider-key.svg)

### Biểu đồ trạng thái: Việc trên bảng phân công (Task)

![Biểu đồ trạng thái: Việc trên bảng phân công (Task)](img/st-task.svg)

## Biểu đồ lớp và thành phần

### SpecGate: kiến trúc thành phần (web_ui → backend → CSDL)

![SpecGate: kiến trúc thành phần (web_ui → backend → CSDL)](img/cls-architecture.svg)

### SpecGate: sơ đồ lớp miền dữ liệu (bảng ws_* trong backend)

![SpecGate: sơ đồ lớp miền dữ liệu (bảng ws_* trong backend)](img/cls-domain.svg)

## Biểu đồ RBAC

### Bảng RBAC SpecGate (✔ được, ✘ không, ◐ có điều kiện)

![Bảng RBAC SpecGate (✔ được, ✘ không, ◐ có điều kiện)](img/rbac.svg)

## Bảng RBAC SpecGate (✔ được, ✘ không, ◐ có điều kiện)

![Bảng RBAC SpecGate (✔ được, ✘ không, ◐ có điều kiện)](img/rbac.svg)

## Bảng RBAC

### Vai trò

| Vai trò | Định nghĩa | Kiểm ở đâu |
|---|---|---|
| **Khách** | Chưa đăng nhập | `proxy.ts` chuyển về `/login?next=…` |
| **Người dùng** | Đã đăng nhập, là chủ workspace riêng của mình, chưa thuộc workspace chung đang xét | cookie `sg_session`, `current_user` |
| **Người xin** | Người dùng có `JoinRequest(status=pending)` với workspace đang xét | `JoinRequest(status=pending)` |
| **Thành viên** | `Membership(role=member)` của workspace chung | `require_member` |
| **Chủ WS** | `Membership(role=owner)`, đồng thời là `ownerId` | `require_owner` |
| **Agent riêng** | Mô hình một người chọn ở workspace riêng, chạy bằng key của người đó. Không tự hành động trong kênh: chỉ chạy khi chủ nó hỏi ở workspace riêng, và tin chỉ vào kênh khi chủ nó gửi | chủ hội thoại, `context.py` |

Vai trò tính **theo từng workspace**: một người có thể là chủ workspace này và là thành viên ở workspace khác. Chủ WS có mọi quyền của Thành viên.

### Ma trận quyền

✔ được · ✘ không · ◐ có điều kiện · – không áp dụng

| Nhóm | Quyền | Khách | Người dùng | Người xin | Thành viên | Chủ WS | Agent riêng |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Tài khoản | Đăng nhập / đăng ký Google, GitHub, mã email | ✔ | – | – | – | – | ✘ |
| Tài khoản | Đăng xuất | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Lưu / đổi / xóa API key của mình (tạo agent riêng) | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Xem key gốc (chỉ thấy 4 ký tự cuối) | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| WS riêng | Chat, tạo lại, đổi tên, xóa hội thoại của mình | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Xem hội thoại riêng của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| WS riêng | Tạo, sửa, dọn dẹp Highlight riêng của mình | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS riêng | Chọn workspace chung làm ngữ cảnh nhóm | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| WS riêng | Tóm tắt tin cũ, Tóm tắt cho nhóm | ✘ | ✘ | ✘ | ✔ | ✔ | ◐⁷ |
| Riêng sang chung | Gửi Highlight riêng / bản tóm tắt vào kênh | ✘ | ✘ | ✘ | ✔ | ✔ | ✘⁶ |
| WS chung | Tạo workspace chung (thành chủ) | ✘ | ✔ | ✔ | ✔ | ✔ | ✘ |
| WS chung | Xem kênh, bảng, bản tổng hợp | ✘ | ✘ | ✘ | ✔ | ✔ | ◐¹ |
| WS chung | Xem thành viên, vai, agent riêng (không thấy key) | ✘ | ✘ | ✘ | ✔ | ✔ | ◐¹ |
| WS chung | Đặt vai, đổi tên trong workspace của mình | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| WS chung | Sửa vai, tên của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| WS chung | Rời workspace | ✘ | ✘ | ✘ | ✔ | ✘ | ✘ |
| WS chung | Sửa đề bài, tên, hiển thị ở Khám phá; tạo kênh | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| WS chung | Xóa thành viên | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Tham gia | Xem và chép mã tham gia | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Tham gia | Đổi mã (mã cũ hết hiệu lực ngay) | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Tham gia | Nhập mã / gửi yêu cầu từ Khám phá | ✘ | ✔ | ✔² | ✘³ | ✘³ | ✘ |
| Tham gia | Hủy yêu cầu của mình | ✘ | ✘ | ✔ | ✘ | ✘ | ✘ |
| Tham gia | Xem, duyệt, từ chối yêu cầu | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Kênh | Gửi tin, @ nhắc người | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Kênh | Highlight cho agent (chỉ mình thấy) | ✘ | ✘ | ✘ | ✔⁴ | ✔⁴ | ✘ |
| Kênh | Xem highlight của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| Kênh | /idea /note /pin /help | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Kênh | /summarize /brief | ✘ | ✘ | ✘ | ✘⁵ | ✔ | ✘ |
| Bảng | Thêm ý lên bảng (cột Đề xuất) | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Bảng | Chuyển ý sang Đang bàn | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Bảng | Chốt / loại (bắt buộc lý do) | ✘ | ✘ | ✘ | ✔⁸ | ✔ | ✘ |
| Bảng | Mở lại ý đã chốt / loại | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |
| Tổng hợp | Dựng lại bản tổng hợp | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |
| Tổng hợp | Xem, tải bản tổng hợp Markdown | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Phân công | Xem bảng phân công | ✘ | ✘ | ✘ | ✔ | ✔ | ◐¹ |
| Phân công | Thêm việc đứng tên mình, nhận việc trống, /task | ✘ | ✘ | ✘ | ✔⁹ | ✔⁹ | ✘ |
| Phân công | Giao việc cho người khác, để trống, sửa, xóa | ✘ | ✘ | ✘ | ✘ | ✔⁹ | ✘ |
| Phân công | Đánh dấu xong / mở lại việc của mình | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| Phân công | Khóa / mở khóa bảng phân công | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ |

1. Agent riêng chỉ "đọc" qua bộ dựng ngữ cảnh khi chủ nó hỏi trong hội thoại chọn workspace: đề bài, thành viên và vai, ý chốt/loại, tin của chủ nó, highlight cho agent của chủ nó kèm người nói.
2. Gửi lại thì cập nhật yêu cầu đang chờ, không tạo trùng.
3. Đã là thành viên thì mở thẳng workspace.
4. Chỉ trên tin của người khác; tin của mình (kể cả thẻ trích dẫn lời agent mình) đã tự vào ngữ cảnh.
5. Hệ thống trả tin "đây là quyền của chủ workspace".
6. Agent không tự gửi: lời agent chỉ vào kênh khi chủ nó gửi một Highlight riêng hoặc bản tóm tắt (BR-15); lệnh trong lời agent không thực hiện.
7. Chỉ chạy khi chủ agent bấm, bằng key của chủ agent; /summarize dùng agent và key của chủ workspace (BR-06).
8. Phương án đang áp dụng của điểm mở 9.3 (BR-21).
9. Chỉ khi bảng phân công chưa khóa (BR-38); chủ đổi trạng thái việc của người khác cũng chỉ khi chưa khóa.

### Ghi chú cài đặt

- Mỗi đường API kiểm quyền ở máy chủ bằng `current_user`, `require_member(ws)`, `require_owner(ws)` trong `backend/app/ws/deps.py` (NFR-04). Hội thoại, Highlight riêng và Highlight cho agent của người khác trả "không tìm thấy" (BR-07, NFR-05).
- Backend kết nối CSDL bằng một tài khoản duy nhất; quyền nằm ở tầng API, không dựa vào RLS của Postgres. Khi dùng Supabase, bật RLS không kèm chính sách để chặn Data API công khai (xem [docs/supabase-setup.md](../docs/supabase-setup.md)).
