# backend

API FastAPI của SpecGate, nằm trong monorepo cạnh `web_ui/` (Next.js). Pipeline ADOM lấy từ repo `spec-gate` (nhánh `cleanup-scripts`, private) đặt cạnh repo này.

```
web_ui (Next.js) ──/api/*──▶ backend (FastAPI) ──import──▶ adom / harness / scoring
                                  └── SQLite (dev) / PostgreSQL
```

JSON dạng camelCase. Ở môi trường dev, `web_ui` chuyển tiếp `/api/*` sang `BACKEND_URL` (mặc định `http://localhost:8000`); trên server, Caddy chuyển thẳng `/api/*` vào backend (xem `../deploy/README.md`).

## Cài đặt

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pip install -e "../../spec-gate/adom[llm]"   # spec-gate đặt cạnh repo này
cp .env.example .env
```

Trên Windows, đặt `$env:PYTHONUTF8 = "1"` trước khi chạy (theo `adom/GUIDE.md`).

## Chạy

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger: http://localhost:8000/docs
- Health (kèm trạng thái import `adom`): http://localhost:8000/api/health

## Chạy bằng Docker

Từ gốc repo: `docker compose up --build` dựng cả `backend` và `web_ui` (xem `../compose.yaml`). Image backend copy pipeline từ `SPEC_GATE_DIR` (mặc định `../spec-gate`); chỉ `adom/pyproject.toml`, `src`, `config`, `tests/fixtures` vào image, không có `.env`, `.llm_cache`, `runs/`.

- Dữ liệu (run, SQLite, cache HumanEval+) nằm trong volume `backend-data` và `dataset-cache`. Xoá sạch: `docker compose down -v`.
- Backend chạy bằng user thường, bỏ mọi capability, `no-new-privileges`, giới hạn tiến trình, RAM, CPU. Code do LLM sinh vẫn chạy chung container và vẫn có mạng.
- API key LLM do người dùng nhập ở trình duyệt, đi theo từng yêu cầu; không nằm trong image, `.env` hay volume.

## Test

```bash
pytest -q                 # mọi test, gồm 2 test chạy pipeline thật với dữ liệu giả (khoảng 15 giây)
pytest -q -m "not slow"   # chỉ test API
```

Test pipeline cần `ADOM_DIR` trỏ đúng và bộ HumanEval+ mà `adom` tự tải về cache; thiếu thì tự skip.

## Chạy pipeline

`POST /api/runs` tạo run rồi chạy nền `setup → admit → run` của `harness.pipeline` (file `app/pipeline.py`, nơi duy nhất biết đến `adom`):

- Mỗi bước là một tiến trình con với `cwd=ADOM_DIR`; output của pipeline nằm ở `RUNS_DIR/<run id>/`, log stdout ở `RUNS_DIR/<run id>.logs/`.
- Các dòng pipeline ghi vào `events.jsonl` được đẩy vào bảng `run_events` (sự kiện `adom_event`) trong lúc đang chạy, nên SSE thấy ngay.
- Sự kiện của backend: `run_created`, `step_started`, `step_done`, `admission_completed` (sau bước admit), `run_done`, `run_failed` (`{step, message}` là dòng lỗi cuối của pipeline).
- Sự kiện ADOM mà UI đã có tên được gửi thêm một lần dưới tên đó (data là nguyên bản ghi ADOM): `admission_step` (các mốc kiểm nạp tĩnh: `STATIC_OK`, `STATIC_REJECTED`, `CROSSCHECK_OK`, `UNIQUE_OUTPUT_CHECKED`, `Z3_ADMISSION`, `Z3_ADMISSION_SKIPPED`, `LOOSENESS_MEASURED`, `ADMISSION_DONE`), `verdict` (`VERDICT`), `repair_deployed` (`MONITOR_REPLACED`), `patch_revoked` (`REVOKED`). Bảng ánh xạ nằm ở `ui_event_name` trong `app/pipeline.py`.
- `status` của run: `pending → setup → admit → run → done | failed`. SSE tự đóng khi run `done`/`failed` và đã gửi hết sự kiện.
- `seed` là chuỗi; chuỗi toàn chữ số được dùng nguyên, chuỗi khác được băm (crc32) thành số cho `--seed`.
- `heldOutTaskIds` luôn rỗng: `adom` giữ lại một phần *input* trong mỗi task làm holdout, không giữ nguyên task.

Chạy thử không tốn API: bật 3 dòng fixtures trong `.env` (xem `.env.example`) rồi

```bash
curl -X POST localhost:8000/api/runs -H "content-type: application/json" -d "{\"taskIds\":[\"HumanEval/53\",\"HumanEval/13\",\"HumanEval/23\"]}"
```

Lưu ý: bước `run` thực thi code do LLM sinh ra, không có sandbox. Với API thật, chạy backend trong container.

## Endpoint

Hợp đồng là `api.md` của UI cũ (kiểu ở `src/lib/api/types.ts`), `web_ui` sẽ sinh client từ OpenAPI của backend (F03). Lỗi luôn có dạng `{ "error", "code"? }`; body/query sai kiểu trả 400. Chức năng cần engine mà backend chưa có trả **501** `ENGINE_NOT_CONFIGURED`, không bao giờ trả số liệu minh hoạ.

Có hai loại run:

- **Pipeline run** (`run_…`, bảng `runs`): một lần `setup → admit → run` của ADOM cho một variant. Các trang Library, Admission, Evidence, Revocation, Annotate, Repair Gate đọc từ đây; `GET /api/runs/current` là pipeline run mới nhất.
- **Evaluation run** (`eval_…`, bảng `eval_runs`): bản ghi của chat testbed / Lịch sử / Thống kê.

| # api.md | Method | Path | Nguồn dữ liệu |
|---|---|---|---|
| 0 | POST | `/api/run`, `/api/run/followup` (SSE) | Trang Hỏi đáp. Mỗi vòng đầu tạo một evaluation run (bảng `eval_runs`, event `run` đầu luồng mang `runId`), lượt hỏi lại ghi tiếp vào run đó (`followup_used`, chỉ một lần, lần 2 → 409). Verdict ánh xạ `consistent→ACC`, `spec_fault→SPEC_FAULT`, `code_fault→CODE_FAULT`, `unknown→UNKNOWN`. Key nhận dạng `SecretStr`, chỉ đưa cho engine (`app/judge.py`), không lưu DB, không log, che `***` trong thông điệp lỗi. Chưa có engine → **501** trước khi ghi DB |
| 1.1–1.3 | GET/POST | `/api/datasets`, `/api/datasets/{id}/tasks` | Bảng `datasets`. Upload JSONL, `?datasetId=&name=&version=` tuỳ chọn |
| 2.1–2.12 | | `/api/runs` (GET, DELETE), `POST /api/runs` `mode:"evaluation"`, `/api/runs/{id}` (GET, PATCH), `/review`, `/followup`, `/api/runs/export`, `/api/logs/stream`, `/api/stats` | Bảng `eval_runs` |
| 2.2b | POST | `/api/runs` (không có `mode`) | Tạo pipeline run (`datasetId`, `seed`, `heldOutRatio`, `level`, `taskIds`). `taskIds` rỗng và `datasetId` là dataset đã upload thì chạy các task của dataset đó |
| 2.4, 2.6 | GET | `/api/runs/current`, `/api/runs/{id}/summary` | `runs`, `tickets`, event `STORE_WRITE_ABORTED`, G∩B từ state |
| 3.1–3.3 | | `/manifest`, `POST /lock-heldout`, `/events` (SSE) | `runs`, `run_events`. Seed/tỷ lệ chỉ đổi được khi pipeline chưa chạy |
| 4.1, 4.2 | GET | `/api/cases`, `/api/cases/{caseId}` | Mỗi event `VERDICT` không thuộc holdout là một case, id `<runId>~<seq>` |
| 4.5 | GET | `/api/runs/{id}/cases/{caseId}/repair-candidates` | Event `REPAIR_CANDIDATES` + `GATE_RESULT` của ADOM (Gate G1–G5 ánh xạ sang tên của UI trong `app/views.py`) |
| 5.1–5.3 | | `/api/tickets/{id}/answer`, `/defer`, `/api/runs/{id}/annotation-queue` | Bảng `tickets`: pipeline mở một vé cho mỗi (task, w) có verdict `UNKNOWN_*` khi run không dùng human oracle giả lập. Trả lời được lưu, không có `resolvedVerdict` (backend không phân xử lại) |
| 6.1, 6.3 | | `/admission`, `POST /admission/review` | Event phase `admission` của ADOM |
| 7.1 | GET | `/evidence` | `state/*.json` của variant; `bSynth` rỗng (ADOM không ghi B_synth ra file) |
| 8.1 | GET | `/revocation` | Event `TASK_START`, `MONITOR_REPLACED`, `REVOKED`, theo từng task (`taskId` thêm vào mỗi bản ghi) |
| 10.1, 10.3, 10.4 | | `/api/experiments/options`, `POST /api/experiments`, `/api/experiments/{id}` | Một experiment là một pipeline run: `anchorLevel→--level`, `policy→--policy`, `unknownMode→--fail-mode`, `humanOracle→--human-oracle`, `baselines→--ablation`, model → `CODER_MODEL`/`SPEC_MODEL` |
| 11.1 | GET | `/api/fault-injection` | Danh mục lỗi ADOM tiêm được (`injected-spec`, `injected-code`) |
| 12.1–12.2 | GET/PUT | `/api/settings` | Bảng `lab_settings`; `.strict()` (trường lạ như `apiKey` → 400), model phải thuộc `MODEL_CATALOG`. `maxCallsBudget→LLM_MAX_CALLS`, `a3TimeoutMs→--a3-timeout`, `enableFlaky→--flaky-probe` áp cho run tạo sau đó |

Trả **501**: `POST /api/run` và `/api/run/followup` (0) cho tới khi có engine, `POST /admission` (6.2), `POST /revocation` (8.2), `/results/{rq}` (9.1), `POST /api/experiments/plan` (10.2), `POST /api/fault-injection` (11.2), `POST /cases/{id}/repair/deploy` (4.3), `POST /runs/{id}/cases/{id}/stream` (4.4).

Endpoint đọc file ADOM thô (ngoài hợp đồng, snake_case): `/api/runs/{id}/tasks`, `/specs`, `/variants`, `/variants/{variant}`, `/variants/{variant}/state/{taskId}`, `/variants/{variant}/monitors/{taskId}`. Tên variant và task chỉ được chấp nhận khi khớp với file có thật trên đĩa.

Schema đổi so với bản trước (thêm cột cho `runs`, thêm bảng): DB SQLite cũ cần xoá (`specgate.db`) vì `create_all` không thêm cột.

## Việc tiếp theo

- Engine Hỏi đáp (`app/llm.py`, `app/routers/judge.py` đang làm dở; `tests/test_judge.py` bị CI bỏ qua tới khi xong) cho `app/judge.py` (`available()`, `run_first`, `run_followup`): cần một lệnh ADOM chạy một tác vụ, trả kết luận và tối đa một câu hỏi.
- Tổng hợp RQ1–RQ6 và số liệu fault injection từ `scoring.compare` (đang 501).
- Engine tương tác cho chat (stream phân xử, deploy thủ công, tiêm vết xấu, chạy lại kiểm nạp).
- Hàng đợi job (arq/RQ) khi cần chạy song song hoặc sống sót qua restart; thêm Alembic, chuyển sang PostgreSQL.
