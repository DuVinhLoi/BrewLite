# Sửa phản hồi tồn kho trên UI — 04/11/2026

Task: `a2/fix-inventory-feedback`, worktree `C:\BrewLite-a2-InventoryFeedback`, base `main` tại `5f09264`. Phụ thuộc nghiệm thu bộ test đang khôi phục trên `a2/restore-tests`; chưa tự merge hoặc deploy bản sửa.

Phạm vi ghi: tài liệu này và hai file `apps/web/src/components/menu/ProductCard.tsx`, `apps/web/src/components/shop/ProductDetail.tsx`. Không đổi API, schema, dependency hoặc hợp đồng component.

## Yêu cầu và bằng chứng đỏ

- SRS AC-F01.3 yêu cầu menu có nhãn `Sắp hết, còn N` khi stock 1–5. `stockBadge` đã tính nhãn nhưng ProductCard bỏ nhãn đó và luôn ghi `Còn hàng` cho món chưa hết.
- SRS AC-F04.4 yêu cầu trang chi tiết hiển thị số ly/nguyên liệu giới hạn của lựa chọn mới và lý do khi thiếu công thức. Hook đã trả current choice có guard chống phản hồi cũ, nhưng JSX chỉ dùng nó để khóa nút và giới hạn input.
- Task B3 đã tái hiện: hai case stock 1 và 5, case lý do công thức và case số ly/nguyên liệu giới hạn đều thất bại; 6 case liên quan khác đạt. Tổng targeted run: 4 failed, 6 passed. Không sửa kỳ vọng để hợp thức hóa UI hiện tại.

SRS không cần đổi tiêu chí; sơ đồ/ADR inventory hiện có không đổi quan hệ hay quyết định kiến trúc. Đây là sửa JSX theo hợp đồng đã duyệt, không thêm model hoặc endpoint. Ma trận test trên PR khôi phục đã gắn UNIT-T14/UNIT-T15 với hai AC trên; các test này phải được bật lại khi nghiệm thu bản sửa.

## Cách sửa và nghiệm thu

Giữ nhãn `Còn hàng` cho tồn kho bình thường, dùng nhãn của `stockBadge` cho trạng thái sắp hết/hết hàng. Trang chi tiết đọc `choice` hiện tại để hiện số ly, tên nguyên liệu giới hạn hoặc lý do không bán được; không thêm fetch/state hay thay logic giữ chỗ.

PR này ở trạng thái draft cho tới khi ghép được commit bộ test đã khôi phục và chạy lại các assertion đỏ thành xanh, cùng lint/typecheck/build. Không coi CI chưa có test của `main` là bằng chứng hồi quy đầy đủ. Quy trình L2 cho phép tạm skip các assertion đỏ trên PR khôi phục với link PR sửa thật; không đưa bản sửa app vào PR chỉ khôi phục test.
