## Việc này làm gì

<!-- Một hai câu. Gắn mã việc trong docs/checklist.md và issue liên quan.
     Dòng "Closes #..." để GitHub tự đóng issue khi merge. -->

- Mã việc:
- Issue: Closes #

## Thay đổi

-
-

## Cách kiểm chứng

<!-- Dán lệnh đã chạy và kết quả, không chỉ mô tả. -->

- [ ] `docker compose up --build` dựng được, mở được `/login`
- [ ] `cd web_ui && pnpm check`
- [ ] `cd backend && pytest -q`
- [ ] Kiểm thử tay các màn hình bị ảnh hưởng (liệt kê ở dưới)

Màn hình đã thử tay:

-

## Ảnh chụp

<!-- Bắt buộc khi thay đổi giao diện; trước và sau nếu sửa bố cục. -->

## Trước khi nhờ duyệt

- [ ] Commit theo Conventional Commits, một việc một commit
- [ ] Không có `.env`, khoá API, mật khẩu, email hay dữ liệu thật trong diff
- [ ] Đã cập nhật issue và tài liệu liên quan (`docs/checklist.md`, `docs/flow.md`)

## Người duyệt cần biết

<!-- Chỗ dễ sai, chỗ đã cố ý bỏ qua, việc còn lại để sau. -->