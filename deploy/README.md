# Triển khai lên VPS

Một VPS chạy `docker compose`: Caddy nhận HTTPS ở cổng 443, hỏi mật khẩu chung (basic auth), rồi chia đường:

```
Internet ──443──> Caddy (HTTPS + basic auth) ─┬─ /api/*, /docs ──> backend:8000 (FastAPI + ADOM)
                                              └─ còn lại ────────> web:3000     (Next.js standalone)
```

Backend và web không mở cổng ra ngoài, chỉ nói chuyện trong mạng nội bộ của compose. Không chạy `compose.yaml` một mình trên server công khai: nó mở cổng 3000 không HTTPS, không mật khẩu.

| File | Việc |
|---|---|
| `../compose.yaml` | Hai service `backend`, `web`; dùng được cả trên máy cá nhân |
| `compose.prod.yaml` | Lớp phủ cho server: thêm Caddy, đóng cổng 3000/8000, `restart: unless-stopped` |
| `Caddyfile` | HTTPS tự động, basic auth, chia `/api/*` và phần còn lại |
| `env.prod.example` | Mẫu `deploy/.env.prod` (tên miền, mật khẩu, giới hạn RAM/CPU) |
| `update.sh` | `git pull` repo này và `spec-gate`, build lại, khởi động lại |
| `../.github/workflows/deploy.yml` | Tự chạy `update.sh` qua SSH khi push lên `main` (khi đã cấu hình) |

## Chuẩn bị

- **VPS** Ubuntu 22.04/24.04, từ 2 vCPU, 4 GB RAM, 20 GB ổ đĩa (pipeline chạy z3 và code do LLM sinh; build Next.js cũng cần RAM).
- **Tên miền** có bản ghi DNS `A` trỏ về IP của VPS; Caddy cần nó để xin chứng chỉ HTTPS.
- **Quyền đọc hai repo**: repo này và `spec-gate` (private, nhánh `cleanup-scripts`, chứa pipeline ADOM). Dùng deploy key chỉ đọc cho từng repo.

## Cài đặt (một lần)

```bash
# 1. Docker và tường lửa
curl -fsSL https://get.docker.com | sh
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw allow 443/udp && sudo ufw enable

# 2. Hai repo cạnh nhau
sudo mkdir -p /opt/specgate && sudo chown "$USER" /opt/specgate && cd /opt/specgate
git clone git@github.com:<tài-khoản>/<repo-này>.git spec_gate
git clone -b cleanup-scripts git@github.com:<tài-khoản>/spec-gate.git spec-gate

# 3. Cấu hình
cd spec_gate
cp deploy/env.prod.example deploy/.env.prod
docker run --rm caddy:2 caddy hash-password --plaintext 'mat-khau-cua-ban'   # dán vào BASIC_HASH, giữ nháy đơn
nano deploy/.env.prod                                                         # DOMAIN, BASIC_USER, BASIC_HASH, BACKEND_MEM/CPUS
cp backend/.env.example backend/.env && nano backend/.env                     # tuỳ chọn: MODEL_CATALOG, LLM_FIXTURES…

# 4. Chạy
./deploy/update.sh
```

Lần build đầu mất vài phút. Xem Caddy xin chứng chỉ bằng `docker compose --env-file deploy/.env.prod -f compose.yaml -f deploy/compose.prod.yaml logs -f caddy`, rồi mở `https://<tên-miền>`.

## Tự deploy khi push (GitHub Actions)

`deploy.yml` chỉ chạy khi repo có biến `DEPLOY_HOST`, nên chưa cấu hình thì không đỏ. Vào **Settings → Environments → production** của repo:

- Variables: `DEPLOY_HOST` (IP hoặc tên miền VPS), `DEPLOY_USER` (user SSH), `DEPLOY_DIR` (mặc định `/opt/specgate/spec_gate`).
- Secret: `DEPLOY_SSH_KEY` là khoá riêng của một cặp khoá chỉ dùng để deploy; khoá công khai thêm vào `~/.ssh/authorized_keys` của user đó trên VPS. User này cần chạy được `docker`.

Từ đó mỗi lần push lên `main` có thay đổi ở `web_ui/`, `backend/`, `deploy/` hoặc `compose.yaml`, workflow SSH vào VPS và chạy `./deploy/update.sh`. Chạy tay ở tab Actions → deploy → Run workflow.

## Vận hành

```bash
alias sg='docker compose --env-file deploy/.env.prod -f compose.yaml -f deploy/compose.prod.yaml'
sg ps                 # trạng thái
sg logs -f backend    # log
sg down               # dừng, giữ dữ liệu; "down -v" xoá luôn SQLite và cache dataset
docker run --rm -v specgate_backend-data:/d -v "$PWD":/b busybox tar czf /b/backup.tgz -C /d .   # sao lưu
```

## Hạn chế cần biết

- **Đăng nhập trong web hiện là giả lập bằng cookie** (chưa có Supabase Auth), nên lớp bảo vệ thật là mật khẩu chung của Caddy. Đừng bỏ `basic_auth` khi chưa có auth thật.
- Code do LLM sinh chạy trong container backend (bỏ capability, giới hạn RAM/CPU/tiến trình) nhưng vẫn có mạng; đừng chạy chung VPS với dịch vụ nhạy cảm khác.
- Hỏi đáp (`POST /api/run`) vẫn trả 501 cho tới khi engine trong `backend/app/judge.py` xong.
- Cấu hình đã kiểm tra bằng `docker compose config` và build thử web ở chế độ standalone; chưa chạy thật trên VPS.
