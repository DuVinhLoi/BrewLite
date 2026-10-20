# ADR-001: Dùng monorepo cho web, API và tài liệu

- **Trạng thái:** Đề xuất (nhóm chốt qua PR)
- **Ngày:** 2026-10-20
- **Liên quan:** đề A2 §9, §6.1

## Bối cảnh
Đề A2 §9 yêu cầu cấu trúc `apps/web`, `apps/api`, `docs`, `tests` trong một repository. Tài liệu (SRS, sơ đồ, ADR) phải truy vết được tới code và test (§8.1).

## Quyết định
Một repository duy nhất. `apps/web` (Next.js) và `apps/api` (NestJS) là hai ứng dụng tách biệt, mỗi cái có Dockerfile riêng; `docs/` và `tests/` dùng chung.

## Chia sẻ và tách
- Chia sẻ: tài liệu, ma trận truy vết, workflow CI/CD, quy ước commit.
- Tách: dependency, build và image của web và API; không import code trực tiếp giữa hai app.

## Hệ quả
- Ưu điểm: một PR sửa được code, tài liệu và ma trận truy vết cùng lúc; lịch sử commit là bằng chứng cho đề.
- Hạn chế: CI phải lọc theo thư mục (hoặc chạy cả hai) để tránh chạy thừa; repo lớn dần.
- Phương án đã loại: hai repo riêng (khó giữ đồng bộ tài liệu và truy vết).
