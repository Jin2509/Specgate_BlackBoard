# backend

API FastAPI của SpecGate Workspace: tài khoản, agent riêng, workspace chung, kênh, highlight và bảng ý tưởng (blackboard) theo `docs/flow.md` và `docs/SRS.md`. Toàn bộ route, kiểu dữ liệu và quy tắc nằm ở [WORKSPACE_API.md](WORKSPACE_API.md).

```
web_ui (Next.js) ──/api/v1/*──▶ backend (FastAPI, app/ws) ──▶ SQLite (dev) / PostgreSQL
                                        └── nhà cung cấp AI, bằng key của từng người dùng
```

JSON dạng camelCase. Ở môi trường dev, `web_ui` chuyển tiếp `/api/v1/*` sang `BACKEND_URL` (mặc định `http://localhost:8000`); trên server, Caddy chuyển thẳng `/api/*` vào backend (xem `../deploy/README.md`).

## Cài đặt

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
python -m app.ws.seed              # dữ liệu mẫu; thêm --reset để làm lại từ đầu
```

## Chạy

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

## Chạy bằng Docker

Từ gốc repo: `docker compose up --build` dựng cả `backend` và `web_ui` (xem `../compose.yaml`).

- SQLite nằm trong volume `backend-data`. Xoá sạch: `docker compose down -v`.
- Backend chạy bằng user thường, bỏ mọi capability, `no-new-privileges`, giới hạn tiến trình, RAM, CPU.
- API key của người dùng được mã hoá (Fernet) trước khi lưu; không nằm trong image hay `.env`.

## Test

```bash
pytest -q
```

Test chạy với agent giả (`LLM_FAKE`), không gọi mạng, không tốn tiền.

## Ghi chú về CSDL

Các bảng và cột của mô-đun bài báo ADOM đã gỡ (`ws_runs`, `ws_board_items.run_id`, `ws_board_items.run_validity`, các bảng `runs`, `datasets`, …) vẫn còn trong CSDL cũ; mã không còn đọc hay ghi chúng. Xoá khi chuyển sang Alembic.
