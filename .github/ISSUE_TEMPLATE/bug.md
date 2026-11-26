---
name: Báo lỗi
about: Ghi lại một lỗi để người khác tái hiện được và bản sửa kiểm chứng được
title: "[Bug] "
labels: bug
assignees: ""
---

## Hiện tượng

<!-- Một câu: việc gì hỏng, ở màn hình nào. -->

## Các bước tái hiện

1.
2.
3.

## Kỳ vọng

<!-- Theo SRS hoặc testplan, đúng ra phải thấy gì. -->

## Thực tế

<!-- Điều đã xảy ra, kèm mã lỗi nếu có. -->

## Môi trường

| Mục | Giá trị |
|---|---|
| Cách chạy | `docker compose up --build` / `pnpm dev` + `uvicorn` |
| Nhánh, commit | |
| Hệ điều hành, trình duyệt | |
| Tài khoản đang dùng | |

## Bằng chứng

<!-- Ảnh chụp màn hình, log backend (`docker compose logs backend`), mã lỗi API.
     Che hết khoá API, token phiên và email thật trước khi dán. -->

## Mức độ

- [ ] Chặn mốc demo (M2 27/11 hoặc M3 04/12)
- [ ] Chặn một ca kiểm thử trong `docs/testplan.md`
- [ ] Không chặn, nhưng sai so với đặc tả
- [ ] Chỉ về giao diện hoặc câu chữ

## Cách sửa dự kiến

<!-- Ai làm, nhánh nào; để trống nếu chưa rõ. -->