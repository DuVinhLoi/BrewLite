# Ledger: thanh toán VNPay sandbox

Plan: [`2026-10-29-vnpay-payment-plan.md`](../../2026-10-29-vnpay-payment-plan.md). Branch tích hợp: `a2/payment-vnpay` (worktree `.worktrees/payment-vnpay`). Chỉ Integrator ghi file này. Orca run: `run_591f7434cdb5`.

## Card

| Card | Agent / công cụ | Bắt đầu | Xong | Vòng sửa | Test đỏ trước xanh | Conflict khi merge | File ngoài phạm vi bị chặn | Token |
|---|---|---|---|---|---|---|---|---|
| W0-DOCS (bước 2.2, 2.4, 4.3, 4.4), branch `ThuanTran260/task-vnpay-w0-docs` (Orca đổi tên từ `gurnard`), worktree `E:/orca/workspaces/BrewLite/vnpay-w0-docs`, dispatch `ctx_46d86d48e0b1`, report [W0-report.md](W0-report.md) | Orca, claude/sonnet | 2026-10-29 21:09 | 21:15, merge `7ec24e6` lúc 21:16 | 0 | không áp dụng | không | không | không đo được |
| SPIKE (bước 1), script ngoài repo | Integrator cùng người dùng | | | | không áp dụng | không áp dụng | không áp dụng | |

## Ruling

- 2026-10-29 21:05: fast-forward `a2/payment-vnpay` từ `73a6ccb` lên `jumbo` (`51f5330`), sau đó commit plan `c6d3403`. Fast-forward trước để không làm nhánh rẽ khỏi `jumbo`.
- 2026-10-29 21:09: chạy W0 (tài liệu không phụ thuộc kết quả spike) song song với spike. SRS, use case checkout, sơ đồ và ADR chờ spike vì AC của FR-14/15/16 lấy từ bảng mục 1.6.
- 2026-10-29 21:09: W0 dùng `--setup skip` vì chỉ sửa tài liệu, không cần `node_modules`.
- 2026-10-29 21:16: W0 qua G1–G6: worktree sạch; 6 file đều trong allowed paths; không trailer; `git diff --check` sạch; report đủ bằng chứng; merge `--no-ff` không conflict; render lại `use-case-overview.puml`, `deployment.puml` ra thư mục tạm: 0 "Syntax Error". Worker đã release.
- 2026-10-29 21:16: nhận tạm mã rủi ro R-13..R-15 do W0 đánh số tiếp bảng rủi ro; nhóm xác nhận khi duyệt. Các điểm còn lại trong mục 4 của W0-report chuyển sang wave sau: NFR-03/AC-N03.1 xử lý ở bước 2.1 (SRS); quy trình đối soát tay chờ nhóm duyệt; câu Docker trong `deployment.md` chỉ đúng sau bước 5.7.
- 2026-10-29 21:16: `deployment.svg` và `use-case-overview.svg` trong repo còn cũ; nhóm xuất lại theo bước 2.4 và 3.5.
