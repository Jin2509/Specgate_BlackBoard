# API SpecGate Workspace

Backend cho các chức năng trong [`docs/SRS.md`](../docs/SRS.md) bản 0.2. Mã nằm ở `app/ws/`, chạy chung FastAPI app với phần ADOM (route ADOM giữ nguyên). JSON dạng camelCase, theo kiểu trong `web_ui/src/lib/types.ts`. Mọi route có tiền tố `/api/v1/v1`. Lỗi luôn có dạng `{ "error": { "code": "<MÃ>", "message": "<câu tiếng Việt>", "details": [] } }`.

## Chạy để kiểm tra

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env              # mặc định LLM_FAKE=true, AUTH_DEV_LOGIN=true
python -m app.ws.seed             # dữ liệu demo Lan / Long / Trang (thêm --reset để làm lại)
uvicorn app.main:app --reload --port 8000
```

Mở http://localhost:8000/docs. Đăng nhập bằng `POST /api/v1/auth/dev-sessions`, ví dụ `{"provider":"github","login":"lan-pham"}`, chép `token`, bấm **Authorize** rồi dán vào. Đổi người dùng thì gọi lại dev-sessions với người khác và Authorize lại.

| Tài khoản demo | dev-sessions | Vai trò |
| --- | --- | --- |
| Lan | `github` / `lan-pham` | Chủ "Đồ án Kiểm chứng" (mã `KC26DAX`), vai "Dựng khung", Claude, có hội thoại gắn workspace và 2 highlight |
| Long | `github` / `long-tran` | Thành viên, vai "Runner", agent kiểu OpenAI |
| Trang | `google` / `trang@example.edu` | Có key, chưa vào workspace chung nào: dùng để thử nhập mã rồi chờ Lan duyệt |

Tài khoản mới: dev-sessions với login chưa có và kèm `displayName`.

Test tự động: `pytest -q tests/test_ws.py` (46 test, mỗi test ghi mã yêu cầu nó kiểm).

### Agent giả (`LLM_FAKE=true`)

Không gọi mạng, không tốn tiền, kết quả tất định:

- Key ngắn hơn 20 ký tự là **key sai**; key kết thúc bằng `0000` là **hết hạn mức**; key khác hợp lệ.
- Câu hỏi kết thúc bằng `[fake-error]` làm nhà cung cấp báo lỗi giữa chừng (để thử UC03 ngoại lệ).
- Câu trả lời cho biết agent đang giữ bao nhiêu câu hỏi trước (FR-16) và có đọc ngữ cảnh nhóm không.

Đặt `LLM_FAKE=false` để gọi thật Anthropic hoặc dịch vụ kiểu OpenAI bằng key bạn nhập. Key trong dữ liệu demo chỉ dùng được với agent giả.

### Đăng nhập thật Google/GitHub

Điền `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `PUBLIC_API_URL`, `FRONTEND_URL`. Callback cần khai báo ở nhà cung cấp: `<PUBLIC_API_URL>/api/auth/{google|github}/callback`. Luồng: trình duyệt mở `GET /api/auth/{provider}/start?next=/w/...` → nhà cung cấp → callback đặt cookie `sg_session` (httpOnly) rồi chuyển về frontend. Trên server công khai đặt `AUTH_DEV_LOGIN=false` và `SECRET_KEY` riêng.

## Endpoint

Mọi endpoint (trừ `/api/v1/auth/*`) cần đăng nhập: `Authorization: Bearer <token>` hoặc cookie `sg_session`. Mọi kiểm quyền nằm ở backend (NFR-03).

### Tài khoản (UC01)

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/api/v1/auth/providers` | Nhà cung cấp nào đã cấu hình, có dev-sessions không |
| GET | `/api/v1/auth/{google\|github}/start?next=&mode=` | Chuyển sang nhà cung cấp; chưa cấu hình → 501 |
| GET | `/api/v1/auth/{provider}/callback` | Hủy ở nhà cung cấp → về `/login?error=cancelled`, không tạo tài khoản |
| POST | `/api/v1/auth/dev-sessions` | `{provider, login, displayName?, next?}` → `{token, user, created, redirect}`. Lần đầu: tạo tài khoản + workspace riêng, `redirect` là màn nhập key |
| GET | `/api/v1/auth/dev-accounts?provider=` | Chỉ khi `AUTH_DEV_LOGIN=true`: tài khoản đã đăng ký của nhà cung cấp, cho màn chọn tài khoản giả lập của UI |
| DELETE | `/api/v1/auth/session` | Đăng xuất, xóa cookie |
| GET | `/api/v1/auth/session` | Người đang đăng nhập, trang mở mặc định (`home`) và các tài khoản Google/GitHub của người đó (`identities`) |
| GET | `/api/v1/me` | Hồ sơ, workspace riêng, key (4 ký tự cuối), agent, workspace chung, yêu cầu đang chờ |
| PUT | `/api/v1/me/last-workspace` | UI gọi khi mở workspace chung; lần đăng nhập sau mở lại workspace này |

### API key và agent riêng (UC02)

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/api/v1/me/key` | Key đã lưu, danh sách nhà cung cấp, lời nhắc gói thuê bao (FR-13) |
| POST | `/api/v1/me/key/verify` | `{provider, apiKey, baseUrl?}` → danh sách mô hình; không lưu gì |
| PUT | `/api/v1/me/key` | Kiểm rồi lưu (mã hóa Fernet). Sai → 400 `KEY_INVALID_KEY` / `KEY_QUOTA` / `KEY_BAD_URL`, không lưu |
| PATCH | `/api/v1/me/key` | `{model}` đổi mô hình |
| DELETE | `/api/v1/me/key` | Xóa key |

### Hội thoại riêng (UC03–UC05)

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET/POST | `/api/v1/conversations` | Danh sách (có `linked`) / tạo mới, `{workspaceId?}` để gắn trước câu hỏi đầu |
| GET/PATCH/DELETE | `/api/v1/conversations/{id}` | PATCH `{workspaceId: "<id>" \| null}` gắn/bỏ gắn. Người khác → 404 |
| POST | `/api/v1/conversations/{id}/turns` | `{text}`. SSE: `user`, `delta` ×n, `done` hoặc `error`. `?stream=false` trả JSON (tiện cho Swagger) |
| GET | `/api/v1/conversations/{id}/context` | Khung "Agent đang đọc": `context` (cấu trúc) và `system` (đúng văn bản gửi cho mô hình) |
| POST | `/api/v1/conversations/{id}/send-to-channel` | `{turnId, channelId, text}`. Tin hiện dưới tên `<mô hình> của <tên>` |

### Workspace chung (UC07, UC14, UC15)

| Method | Path | Ghi chú |
| --- | --- | --- |
| POST | `/api/v1/workspaces` | `{name, brief, visibility}`; tạo sẵn `#chung` và mã 7 ký tự |
| GET/PATCH | `/api/v1/workspaces/{ws}` | Không là thành viên → 403 `NOT_MEMBER` (UI chuyển sang Khám phá, FR-39). PATCH chỉ chủ |
| GET/POST | `/api/v1/workspaces/{ws}/channels` | POST chỉ chủ |
| GET | `/api/v1/workspaces/{ws}/members` | Quyền, vai, agent (mô hình, nhà cung cấp) hoặc `null` = chưa nhập key |
| PUT | `/api/v1/workspaces/{ws}/members/me/team-role` | `{teamRole}` ≤ 40 ký tự, chỉ vai của mình |
| GET/PUT | `/api/v1/workspaces/{ws}/join-code` | Xem (mọi thành viên) / đổi mã (chủ) |
| GET | `/api/v1/workspaces/{ws}/join-requests` | Chỉ chủ: `pending` và `history` |

### Kênh (UC06, UC10)

`{ch}` là id hoặc tên kênh (`chung`).

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/api/v1/workspaces/{ws}/channels/{ch}/messages?after=<seq>` | Tin (mỗi tin có `sender` là người đứng sau, với tin agent là chủ agent), `ownMessageIds` (tin đã tự vào ngữ cảnh), `myHighlights` (vệt phấn của mình) |
| POST | `/api/v1/workspaces/{ws}/channels/{ch}/messages` | `{text, replyToId?}`. Tin bắt đầu bằng lệnh thì chạy lệnh; trả về tin của mình và tin hệ thống trả lời |
| GET | `/api/v1/workspaces/{ws}/channels/{ch}/stream?after=<seq>` | SSE `message` cho mọi người đang mở kênh, `ping` mỗi 15 giây. Các response SSE mang `Cache-Control: no-transform` để proxy (kể cả rewrite của Next dev) không nén và đệm luồng |
| GET | `/api/v1/workspaces/{ws}/channels/{ch}/highlight-preview/{msg}` | Người nói, có highlight được không |
| POST | `/api/v1/workspaces/{ws}/channels/{ch}/highlights` | `{messageId, text, label: important\|review}` |
| GET | `/api/v1/highlights?workspaceId=` | "Highlight của tôi", nhóm theo workspace |
| DELETE | `/api/v1/highlights/{id}` | Chỉ người tạo |

Lệnh: `/idea <nội dung>`, `/note <nội dung>`, `/pin` (kèm `replyToId`), `/decide #<số> chốt|loại <lý do>`, `/summarize` và `/brief` (chỉ chủ), `/help`. Lệnh chỉ chạy khi là từ đầu tiên của tin do người gửi; tin agent gửi qua `send-to-channel` không bao giờ chạy lệnh.

### Bảng ý tưởng và tổng hợp (UC11–UC13)

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET/POST | `/api/v1/workspaces/{ws}/board` | Bốn cột + ghi chú / thêm thẻ (giống `/idea`, `/note`) |
| PUT | `/api/v1/workspaces/{ws}/board/{số}/decision` | `{decision: decided\|rejected, reason}` |
| PUT | `/api/v1/workspaces/{ws}/board/{số}/status` | `{status: "discussing"}`: Đề xuất → Đang bàn |
| GET/POST | `/api/v1/workspaces/{ws}/brief` | Xem bản mới nhất (mọi thành viên) / dựng (chủ, giống `/brief`) |
| GET | `/api/v1/workspaces/{ws}/brief.md` | Tải Markdown |

### Tham gia (UC08, UC09)

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/api/v1/explore?q=&selected=` | Workspace công khai và quan hệ `none` / `pending` / `member` |
| POST | `/api/v1/join-requests` | `{code}` (nhận cả chữ thường, dấu cách, gạch nối) hoặc `{workspaceId, message}` từ Khám phá |
| GET | `/api/v1/join-requests/mine` | Yêu cầu của mình |
| GET | `/api/v1/join-requests/{id}` | Trang "Đang chờ duyệt" hỏi lại định kỳ; khi duyệt có `redirect` |
| PATCH | `/api/v1/join-requests/{id}` | `{status: cancelled}` (người xin) hoặc `{status: approved\|rejected}` (chủ) |

## Bảng đối chiếu để kiểm tra

Cột "Test" là tên hàm trong `tests/test_ws.py`.

| Yêu cầu | Cách kiểm tay | Kết quả đúng | Test |
| --- | --- | --- | --- |
| FR-01 | Gọi `GET /api/me` không token | 401 `UNAUTHENTICATED` | `test_fr01_requires_login` |
| FR-02 | dev-sessions `provider: "facebook"` | 400 | `test_fr02_validation_and_unknown_signin` |
| FR-03 | dev-sessions login mới + `displayName` | `created: true`, `redirect` tới `/chat/key?welcome=…` | `test_fr03_fr04_signup_creates_once` |
| FR-04 | dev-sessions lại cùng login (khác hoa thường) | `created: false`, cùng `user.id` | như trên |
| FR-05 | `DELETE /api/v1/auth/session` rồi `GET /api/me` bằng cookie | 401 | `test_fr05_cookie_session_and_logout` |
| FR-10, FR-11 | `POST /api/me/key/verify` key ≥ 20 ký tự | Danh sách mô hình | `test_fr11_verify_returns_models` |
| FR-12 | `PUT /api/me/key` key `short`, hoặc key đuôi `0000` | 400 kèm câu tiếng Việt; `GET /api/me` vẫn `key: null` | `test_fr12_bad_key_not_saved` |
| FR-13 | `GET /api/me/key` | `note` nhắc ChatGPT Plus / Claude Pro | `test_fr10_fr14_…` |
| FR-14 | Lưu key rồi xem mọi phản hồi | Chỉ có `keyLast4`; DB chỉ có bản mã hóa | `test_fr10_fr14_key_saved_encrypted_last4_only` |
| FR-15 | Tạo, mở, xóa hội thoại; xem danh sách | Có `linked` cho hội thoại gắn workspace | `test_fr15_fr16_conversation_lifecycle` |
| FR-16 | Hỏi hai câu | Câu trả lời thứ hai "giữ 1 câu hỏi trước" | như trên |
| FR-17 | `POST …/turns` (stream) bằng curl `-N` | Nhiều sự kiện `delta` rồi `done` | `test_fr17_stream_events` |
| UC03 ngoại lệ | Hỏi câu kết thúc bằng `[fake-error]` | Câu hỏi còn; lượt trả lời là câu báo lỗi có `error` | `test_uc03_provider_error_keeps_question` |
| FR-18, NFR-04 | Long mở hội thoại của Lan | 404 | `test_fr18_nfr04_conversation_private` |
| FR-19 | Đổi mô hình | `agent.label` = `<mô hình> của <tên>` | `test_fr19_choose_model_and_label` |
| FR-25 | Gắn / bỏ gắn; Trang gắn workspace mình không thuộc | Trang nhận 403 `NOT_MEMBER` | `test_fr25_link_unlink_and_members_only` |
| FR-26 | `GET …/context` hội thoại "Thống nhất với runner" của Lan | Đề bài, đội + vai + mô hình, ý chốt/loại kèm lý do, tin của Lan, 2 highlight "chưa chốt" kèm người nói; **không** có tin "Mình thêm…" của Long ngoài phần đã highlight | `test_fr26_group_context_contents` |
| FR-27 | Xóa một highlight rồi gọi lại `…/context` | Highlight biến mất khỏi `context` và `system` | `test_fr27_removing_highlight_updates_context` |
| FR-28, FR-29 | `send-to-channel` một lượt trả lời | Tin `senderKind: agent`, `senderName` = `postAs` của lượt | `test_fr28_fr29_send_answer_to_channel` |
| FR-20, FR-21 | Lan highlight tin của Long | Lưu bản chụp, `speaker: "Long"` | `test_fr20_fr24_highlight` |
| FR-22 | Long xóa hội thoại đã gửi tin vào kênh | Highlight của Lan trên tin đó vẫn còn | `test_fr22_…` |
| FR-23 | Lan highlight tin của chính Lan | 400 `OWN_MESSAGE` "đã tự vào ngữ cảnh" | `test_fr23_cannot_highlight_own` |
| FR-24 | Long gọi `GET /api/highlights` | Không thấy highlight của Lan | `test_fr20_fr24_highlight` |
| FR-30 | Tạo workspace thiếu tên/đề bài | 400 `MISSING_FIELDS` | `test_fr30_create_workspace` |
| FR-31, FR-32 | Long xem mã; Lan đổi mã; Trang nhập mã cũ | Mã cũ → 404 `INVALID_CODE` | `test_fr31_fr32_join_code` |
| FR-33, FR-36, FR-38 | Trang nhập `KC26DAX`, gửi lại lần 2, Lan duyệt | Một yêu cầu duy nhất; sau duyệt có `redirect` | `test_fr33_fr36_fr38_request_flow` |
| FR-34, FR-35 | Trang tìm "đề tài" ở Khám phá | Thấy workspace công khai, không thấy workspace ẩn | `test_fr34_fr35_explore` |
| FR-36 | Hủy yêu cầu đang chờ | `cancelled`; hủy lần 2 → 409 | `test_fr36_cancel_and_reject` |
| FR-37 | Long xem yêu cầu tham gia | 403 | `test_fr37_only_owner_sees_requests` |
| FR-39 | Trang `GET /api/workspaces/{ws}` | 403 `NOT_MEMBER` | `test_fr33_…` |
| FR-40, FR-43 | Gửi "Chào @Long" | Chỉ một tin, có đoạn `mention`; không agent nào trả lời | `test_fr40_fr43_channel_messages` |
| FR-41 | Mở `…/stream` bằng `curl -N` dưới tên Long, Lan gửi tin | Long nhận `event: message` ngay | `test_fr41_broker_delivers` |
| FR-44, FR-62 | `GET …/members` | Mô hình, nhà cung cấp; `agent: null` nếu chưa có key; không có key | `test_fr44_fr62_…` |
| FR-49 | Gửi `/help` | Tin hệ thống liệt kê lệnh | `test_fr49_help` |
| FR-50, FR-51 | `/idea`, `/note`, trả lời tin agent rồi `/pin` | Bốn cột; thẻ từ tin agent ghi "Agent của Lan" | `test_fr50_fr51_board_commands` |
| FR-52, FR-53 | `/decide #1 chốt` không lý do; chốt rồi loại lại | "phải có lý do"; lần 2 "không đổi được nữa" | `test_fr52_fr53_decide` |
| FR-54 | Long gửi `/summarize`, `/brief` | Tin từ chối kèm lý do | `test_fr54_owner_only_commands` |
| FR-55 | Lan gửi `/summarize` | Tin agent dưới tên `claude-sonnet-5-5 của Lan` | `test_fr55_…` |
| FR-56 | Lan `/brief`, Long tải `brief.md` | Có Đã chốt, Đã loại kèm lý do, Còn đang bàn | `test_fr56_brief` |
| FR-60 | Long sửa đề bài / tạo kênh | 403; Lan làm được | `test_fr60_owner_config` |
| FR-61 | Đặt vai 41 ký tự | 400; ≤ 40 ký tự thì lưu | `test_fr61_team_role` |
| BR-08 | Gửi vào kênh từ hội thoại một đoạn bắt đầu bằng `/decide …` | Tin hiện nguyên văn, không chạy lệnh | `test_fr28_fr29_…` |
| NFR-01 | Tìm key đầy đủ trong mọi phản hồi | Không có | `test_fr10_fr14_…`, `test_fr44_fr62_…` |
| NFR-07 | `CONTEXT_OWN_MESSAGES_MAX=3`, gửi 5 tin | Giữ 3 tin mới nhất, `ownMessagesOmitted: 2`, highlight không bị cắt | `test_nfr07_…` |

## Các điểm SRS mục 8 còn mở: backend đang chọn

| # | Lựa chọn hiện tại | Đổi ở đâu |
| --- | --- | --- |
| 1 | `/summarize` chạy bằng agent và key của chủ | `app/ws/routers/channels.py` `_summarize` |
| 2 | Nhắc `@Lan` không đưa tin vào ngữ cảnh của Lan | `app/ws/context.py` |
| 3 | Highlight chỉ người tạo thấy | `app/ws/routers/highlights.py` |
| 4 | Tối đa 50 tin của mình, không giới hạn highlight | `CONTEXT_OWN_MESSAGES_MAX` |
| 5 | Không có câu hỏi mở / tóm tắt cuộn trên bảng | `app/ws/board.py` |
| 6 | Giữ `/note` | `app/ws/commands.py` |
| 7 | Chỉ chủ tạo kênh | `app/ws/routers/workspaces.py` |
| 8 | Mọi thành viên chuyển Đề xuất → Đang bàn (`PUT …/status`) | `app/ws/board.py` `move_to_discussing` |
| 9 | Chưa có rời workspace / xóa thành viên / xóa workspace. Nếu mất quyền thành viên: hội thoại vẫn còn nhưng không gửi ngữ cảnh nhóm, không gửi vào kênh được | — |

## Giới hạn hiện tại

- Dùng SQLite và `create_all` như phần ADOM; chưa có Alembic, chưa chuyển Supabase Postgres / Auth / Vault / Realtime như `overallweb.md` §5. Khóa mã hóa API key lấy từ `SECRET_KEY` (hoặc `KEY_ENCRYPTION_KEY`): đổi khóa thì key đã lưu không đọc được, người dùng phải nhập lại.
- Realtime chạy trong một tiến trình (broker trong bộ nhớ). Chạy nhiều worker uvicorn thì cần Postgres LISTEN/NOTIFY hoặc Supabase Realtime.
- Với Anthropic, `GET /v1/models` không biết key đã hết tiền; lỗi hết hạn mức chỉ hiện ở lần chat đầu.
- Địa chỉ API kiểu OpenAI trỏ vào mạng nội bộ bị chặn (chống SSRF). Dùng Ollama trên máy thì đặt `ALLOW_PRIVATE_BASE_URLS=true`.
- Frontend `web_ui` vẫn chạy trên dữ liệu giả; chưa nối vào các endpoint này.
