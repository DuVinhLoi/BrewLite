# ADR-001: Dùng monorepo

- **Trạng thái:** Đề xuất (nhóm chốt)
- **Ngày:** 2026-10-20

## Bối cảnh
Đề A2 §9 yêu cầu cấu trúc `apps/web`, `apps/api`, `docs` trong một repository; tài liệu và code cần truy vết với nhau.

## Quyết định
Một repository duy nhất, tách thư mục `apps/web`, `apps/api`, `docs`, `tests`.

## Hệ quả
- Ưu điểm: Một PR có thể sửa code, tài liệu và test cùng lúc; dễ làm ma trận truy vết.
- Hạn chế/trade-off: CI cần chạy theo thư mục thay đổi để tránh chạy thừa.
