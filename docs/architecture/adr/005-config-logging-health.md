# ADR-005: Cấu hình, logging và health check

- **Trạng thái:** Đề xuất (nhóm chốt)
- **Ngày:** 2026-10-20

## Bối cảnh
Cần vận hành được trên production và không lộ secret (Task 5.4).

## Quyết định
Cấu hình qua biến môi trường, validate khi khởi động, `.env.example` không chứa giá trị thật; log JSON ra stdout, không ghi secret/JWT; `GET /health` kiểm tra API và DB, dùng cho nền tảng và smoke test.

## Hệ quả
- Ưu điểm: Cùng một cách cấu hình cho local, CI, production; smoke test tự động.
- Hạn chế/trade-off: Phải kỷ luật khi ghi log để không rò rỉ dữ liệu nhạy cảm.
