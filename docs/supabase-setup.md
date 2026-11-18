# Kết nối SpecGate với Supabase

Hướng dẫn chuyển CSDL của backend từ SQLite sang Postgres do Supabase quản lý. Áp dụng cho mã hiện tại trong `backend/` (FastAPI + SQLAlchemy 2).

## 1. Supabase dùng vào việc gì

| Thành phần Supabase | Dùng không | Ghi chú |
| --- | --- | --- |
| Postgres | Có | Thay SQLite qua biến `DATABASE_URL`. Mọi bảng `ws_*` và bảng ADOM (`runs`, `tickets`…) nằm ở đây |
| Auth | Không | Backend tự làm OAuth Google/GitHub và tự ký phiên (`app/ws/security.py`). Đổi sang Supabase Auth là một thay đổi mã riêng |
| Realtime | Không | Kênh chat dùng SSE và bộ phát tin trong tiến trình (`app/ws/realtime.py`). Chỉ cần đổi khi chạy nhiều bản backend |
| Data API (PostgREST), Storage | Không | Nên tắt Data API hoặc bật RLS để không ai đọc bảng qua khóa `anon` (mục 6) |

Backend kết nối Postgres bằng một tài khoản duy nhất và tự kiểm quyền ở tầng API (`require_member`, `require_owner`). Trình duyệt không bao giờ nói chuyện trực tiếp với Supabase.

## 2. Tạo project

1. Vào [supabase.com/dashboard](https://supabase.com/dashboard), chọn **New project**.
2. Đặt tên, ví dụ `specgate`. Chọn vùng gần người dùng, với Việt Nam là **Southeast Asia (Singapore)**.
3. Đặt **Database password** đủ mạnh và lưu vào trình quản lý mật khẩu. Supabase không hiện lại mật khẩu này.
4. Chờ project khởi tạo xong (khoảng 1 đến 2 phút).

Gói Free tạm dừng project sau khoảng một tuần không có truy cập và không có sao lưu hằng ngày. Dùng gói trả phí cho server thật.

## 3. Lấy chuỗi kết nối

Trong project, bấm **Connect** ở thanh trên cùng. Supabase đưa ba loại chuỗi:

| Loại | Máy chủ, cổng | Khi nào dùng |
| --- | --- | --- |
| Direct connection | `db.<project-ref>.supabase.co:5432` | Máy có IPv6. Nhiều VPS và mạng gia đình chỉ có IPv4 nên không kết nối được |
| **Session pooler** | `aws-0-<vùng>.pooler.supabase.com:5432`, user `postgres.<project-ref>` | **Chọn loại này.** Chạy qua IPv4, hợp với server FastAPI chạy lâu |
| Transaction pooler | cùng máy chủ, cổng `6543` | Không dùng: không hỗ trợ prepared statement, backend cần sửa mã mới chạy được |

Chép chuỗi Session pooler rồi đổi thành dạng SQLAlchemy với driver psycopg 3:

```text
postgresql+psycopg://postgres.<project-ref>:<mật-khẩu>@aws-0-<vùng>.pooler.supabase.com:5432/postgres?sslmode=require
```

- Tiền tố phải là `postgresql+psycopg://`, không phải `postgres://` hay `postgresql://` (hai dạng này làm SQLAlchemy tìm driver psycopg2).
- Mật khẩu có ký tự đặc biệt (`@`, `:`, `/`, `#`, `%`…) phải mã hóa URL. Lấy chuỗi đã mã hóa bằng lệnh dưới, thay `mat-khau` bằng mật khẩu thật:

```bash
python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" 'mat-khau'
```

## 4. Cài driver Postgres

`backend/pyproject.toml` hiện chưa có driver Postgres. Thêm `psycopg[binary]` vào `dependencies`:

```toml
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.29",
    "sqlalchemy>=2.0",
    "pydantic>=2.6",
    "pydantic-settings>=2.2",
    "httpx>=0.27",
    "cryptography>=42",
    "psycopg[binary]>=3.2",
]
```

Rồi cài lại trong môi trường ảo của backend:

```bash
cd backend && .venv/bin/pip install -e ".[dev]"
```

Docker tự cài theo `pyproject.toml` khi build lại image.

## 5. Cấu hình backend

### 5.1. Chạy trực tiếp trên máy

Trong `backend/.env` (tệp này đã nằm trong `.gitignore`, không commit):

```dotenv
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<mật-khẩu>@aws-0-<vùng>.pooler.supabase.com:5432/postgres?sslmode=require

# Giữ NGUYÊN hai giá trị này nếu chuyển dữ liệu cũ sang (mục 7):
# key API của người dùng được mã hóa bằng khóa suy ra từ đây, đổi là không giải mã được nữa.
SECRET_KEY=<giá trị đang dùng>
KEY_ENCRYPTION_KEY=<giá trị đang dùng, nếu có>
```

Kiểm tra kết nối:

```bash
cd backend && .venv/bin/python -c "from sqlalchemy import text; from app.db import engine; print(engine.connect().execute(text('select version()')).scalar())"
```

Dòng in ra bắt đầu bằng `PostgreSQL 15` hoặc `PostgreSQL 17` là đã kết nối được.

Khởi động backend như thường. Lần đầu, `Base.metadata.create_all` trong `app/main.py` tạo toàn bộ bảng trên Supabase. Mở **Table Editor** trên dashboard để thấy các bảng `ws_users`, `ws_workspaces`, `ws_messages`…

### 5.2. Chạy bằng Docker Compose

`compose.yaml` ghi đè `DATABASE_URL` bằng SQLite trong khối `environment`, và khối này thắng giá trị trong `backend/.env`. Muốn dùng Supabase, sửa dòng đó để nhận giá trị từ ngoài, còn mặc định vẫn là SQLite:

```yaml
    environment:
      ADOM_DIR: /opt/spec-gate/adom
      RUNS_DIR: /data/runs
      DATABASE_URL: ${DATABASE_URL:-sqlite:////data/specgate.db}
```

Rồi đặt `DATABASE_URL` trong tệp env dùng cho compose (trên server là `deploy/.env.prod`, chạy kèm `--env-file`), không ghi mật khẩu vào `compose.yaml`.

## 6. Khóa Data API của Supabase

Mọi bảng trong schema `public` đều có thể đọc qua Data API bằng khóa `anon`, là khóa công khai, nếu bảng chưa bật Row Level Security. Bảng `ws_*` chứa hội thoại riêng, highlight và key đã mã hóa, nên phải chặn. Chọn một trong hai cách, nên làm cả hai:

**Cách 1: tắt Data API.** Vào **Project Settings → Data API**, tắt Data API. SpecGate không dùng nó.

**Cách 2: bật RLS cho mọi bảng, không kèm chính sách nào.** Vào **SQL Editor**, chạy:

```sql
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
```

Không có chính sách nghĩa là vai `anon` và `authenticated` không đọc, không ghi được dòng nào. Backend vẫn chạy bình thường vì nó kết nối bằng vai `postgres`, là chủ các bảng, và chủ bảng không bị RLS chặn.

Chạy lại đoạn SQL này mỗi khi backend tạo thêm bảng mới. Kiểm tra bằng **Advisors → Security Advisor**: không còn cảnh báo "RLS disabled in public".

## 7. Chuyển dữ liệu cũ từ SQLite (tùy chọn)

Bỏ qua mục này nếu bắt đầu với CSDL trống.

1. Dừng backend để SQLite không đổi trong lúc chép.
2. Chạy backend một lần với `DATABASE_URL` trỏ Supabase cho tới khi khởi động xong, để tạo bảng; rồi dừng.
3. Lưu đoạn sau vào một tệp ngoài repo, ví dụ `/tmp/copy_sqlite_to_supabase.py`, rồi chạy từ thư mục `backend/`:

```python
# Copies every SpecGate table from a SQLite file into the Postgres database in DATABASE_URL.
import os
import sys

from sqlalchemy import Integer, create_engine, select, text

from app import models  # noqa: F401  (registers the ADOM tables)
from app.db import Base
from app.ws import models as ws_models  # noqa: F401  (registers the ws_ tables)

source = create_engine(f"sqlite:///{sys.argv[1]}")
target = create_engine(os.environ["DATABASE_URL"])

with source.connect() as reader, target.begin() as writer:
    for table in Base.metadata.sorted_tables:
        rows = [dict(row) for row in reader.execute(select(table)).mappings()]
        if rows:
            writer.execute(table.insert(), rows)
        print(f"{table.name}: {len(rows)}")
    for table in Base.metadata.sorted_tables:
        for column in table.primary_key.columns:
            if isinstance(column.type, Integer):
                writer.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{table.name}', '{column.name}'), "
                    f"COALESCE((SELECT MAX({column.name}) FROM {table.name}), 0) + 1, false)"
                ))
```

```bash
cd backend && DATABASE_URL='postgresql+psycopg://…' .venv/bin/python /tmp/copy_sqlite_to_supabase.py ./specgate.db
```

- Đoạn cuối đặt lại bộ đếm của các khóa chính tự tăng (`ws_members.id`, `ws_oauth_accounts.id`…); thiếu bước này thì lần thêm dòng đầu tiên sau khi chuyển sẽ báo trùng khóa.
- Bảng đích phải trống. Chạy lại lần hai sẽ báo trùng khóa chính.
- Giữ nguyên `SECRET_KEY` và `KEY_ENCRYPTION_KEY` như mục 5.1, nếu không mọi API key đã lưu đều thành không dùng được và người dùng phải nhập lại.

## 8. Những điều cần biết khi chạy trên Postgres

- **Thêm cột cho bảng đã có.** `app/ws/migrate.py` tự thêm cột mới khi khởi động, nhưng với cột kiểu `Boolean` nó sinh `DEFAULT 1` / `DEFAULT 0`. Postgres từ chối giá trị này cho cột boolean, nên backend sẽ lỗi khi khởi động nếu sau này mô hình có thêm cột boolean. CSDL mới tạo không bị, vì `create_all` đã tạo đủ cột. Trước khi thêm cột boolean, chuyển sang Alembic như ghi chú trong `migrate.py`, hoặc thêm cột tay trong SQL Editor (`ALTER TABLE … ADD COLUMN … BOOLEAN DEFAULT false`).
- **Kết nối rảnh bị đóng.** Pooler có thể đóng kết nối không dùng lâu; khi đó yêu cầu đầu tiên sau khoảng lặng có thể lỗi. Nếu gặp, bật `pool_pre_ping=True` khi tạo engine trong `app/db.py`.
- **Một bản backend.** Kênh thời gian thực phát tin trong tiến trình, nên chỉ chạy một bản uvicorn. Muốn chạy nhiều bản thì phải thay `app/ws/realtime.py` bằng Postgres `LISTEN/NOTIFY` hoặc Supabase Realtime.
- **Kiểm thử vẫn dùng SQLite.** `pytest` tạo CSDL SQLite tạm; không trỏ `DATABASE_URL` của bộ kiểm thử vào Supabase.
- **Sao lưu.** Gói trả phí có sao lưu hằng ngày ở **Database → Backups**. Tự sao lưu bằng `pg_dump` với chuỗi Direct connection hoặc Session pooler.
- **Không lộ chuỗi kết nối.** Chuỗi chứa mật khẩu CSDL: chỉ để trong `.env` hoặc biến môi trường của server, không commit, không dán vào issue hay log. Lộ thì đổi ở **Project Settings → Database → Reset database password**.

## 9. Kiểm tra sau khi chuyển

1. `GET /api/v1/health` trả `{"status": "ok", …}`.
2. Đăng nhập, mở workspace riêng: hội thoại cũ còn (nếu đã chuyển dữ liệu).
3. Gửi một tin trong kênh từ hai trình duyệt: tin hiện ở trình duyệt kia trong dưới 2 giây (NFR-06).
4. Hỏi agent một câu: key đã lưu vẫn dùng được, tức là khóa mã hóa đã giữ đúng.
5. Trên dashboard, **Table Editor → ws_messages** có tin vừa gửi; **Security Advisor** không có cảnh báo RLS.
