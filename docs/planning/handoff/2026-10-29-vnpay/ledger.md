# Ledger: thanh toán VNPay sandbox

Plan: [`2026-10-29-vnpay-payment-plan.md`](../../2026-10-29-vnpay-payment-plan.md). Branch tích hợp: `a2/payment-vnpay` (worktree `.worktrees/payment-vnpay`). Chỉ Integrator ghi file này. Orca run: `run_591f7434cdb5`.

## Card

| Card | Agent / công cụ | Bắt đầu | Xong | Vòng sửa | Test đỏ trước xanh | Conflict khi merge | File ngoài phạm vi bị chặn | Token |
|---|---|---|---|---|---|---|---|---|
| W0-DOCS (bước 2.2, 2.4, 4.3, 4.4), branch `ThuanTran260/task-vnpay-w0-docs` (Orca đổi tên từ `gurnard`), worktree `E:/orca/workspaces/BrewLite/vnpay-w0-docs`, dispatch `ctx_46d86d48e0b1`, report [W0-report.md](W0-report.md) | Orca, claude/sonnet | 2026-10-29 21:09 | 21:15, merge `7ec24e6` lúc 21:16 | 0 | không áp dụng | không | không | không đo được |
| W1-SRS (bước 2.1), branch `ThuanTran260/docs-vnpay-w1-srs`, worktree `E:/orca/workspaces/BrewLite/vnpay-w1-srs`, dispatch `ctx_30691a90d743`, report [W1-SRS-report.md](W1-SRS-report.md) | Orca, claude/sonnet | 2026-10-29 21:21 | 21:34, merge `6da090b` lúc 21:37 | 0 | không áp dụng | không | không | không đo được |
| W1-UCDIAG (bước 2.3, 3.1–3.5), branch `ThuanTran260/task-vnpay-w1-ucdiag` (Orca đổi tên từ `cory`), worktree `E:/orca/workspaces/BrewLite/vnpay-w1-ucdiag`, dispatch `ctx_b7504e646cf2`, report [W1-UCDIAG-report.md](W1-UCDIAG-report.md) | Orca, claude/sonnet | 2026-10-29 21:21 | 21:36, merge `3db5ec6` lúc 21:37 | 0 | không áp dụng | không | không | không đo được |
| W1-ADR (bước 4.1–4.2), branch `ThuanTran260/vnpay-w1-adr`, worktree `E:/orca/workspaces/BrewLite/vnpay-w1-adr`, dispatch `ctx_d3c01c3c1b03`, report [W1-ADR-report.md](W1-ADR-report.md) | Orca, claude/sonnet | 2026-10-29 21:21 | 21:30, merge `601d469` lúc 21:37 | 0 | không áp dụng | không | không | không đo được |
| SPIKE (bước 1), script ngoài repo | Integrator cùng người dùng | | | | không áp dụng | không áp dụng | không áp dụng | |

## Ruling

- 2026-10-29 21:05: fast-forward `a2/payment-vnpay` từ `73a6ccb` lên `jumbo` (`51f5330`), sau đó commit plan `c6d3403`. Fast-forward trước để không làm nhánh rẽ khỏi `jumbo`.
- 2026-10-29 21:09: chạy W0 (tài liệu không phụ thuộc kết quả spike) song song với spike. SRS, use case checkout, sơ đồ và ADR chờ spike vì AC của FR-14/15/16 lấy từ bảng mục 1.6.
- 2026-10-29 21:09: W0 dùng `--setup skip` vì chỉ sửa tài liệu, không cần `node_modules`.
- 2026-10-29 21:16: W0 qua G1–G6: worktree sạch; 6 file đều trong allowed paths; không trailer; `git diff --check` sạch; report đủ bằng chứng; merge `--no-ff` không conflict; render lại `use-case-overview.puml`, `deployment.puml` ra thư mục tạm: 0 "Syntax Error". Worker đã release.
- 2026-10-29 21:16: nhận tạm mã rủi ro R-13..R-15 do W0 đánh số tiếp bảng rủi ro; nhóm xác nhận khi duyệt. Các điểm còn lại trong mục 4 của W0-report chuyển sang wave sau: NFR-03/AC-N03.1 xử lý ở bước 2.1 (SRS); quy trình đối soát tay chờ nhóm duyệt; câu Docker trong `deployment.md` chỉ đúng sau bước 5.7.
- 2026-10-29 21:16: `deployment.svg` và `use-case-overview.svg` trong repo còn cũ; nhóm xuất lại theo bước 2.4 và 3.5.
- 2026-10-29 21:21: chạy Wave 1 (SRS, UC-04 + sơ đồ, ADR) song song trước spike vì `apps/api/.env` chưa có. Rủi ro khoanh bằng [contract.md](contract.md): chốt mã dùng chung trước, hành vi sandbox chưa đo gắn nhãn "(chờ spike)" ở đúng ba điểm (contract mục 6). Ruling 21:09 (SRS/UC/ADR chờ spike) được thay bằng ruling này.
- 2026-10-29 21:37: ba card W1 qua G1–G4: worktree sạch; file đổi nằm trong allowed paths; không trailer; `git diff --check` sạch; report đủ bằng chứng. Ba branch không chung file nào. Merge `--no-ff` theo thứ tự SRS → UCDIAG → ADR, không conflict. Cả ba worker đã release.
- 2026-10-29 21:37: G6 sau merge: render 7 file `.puml` (5 file W1 cùng `use-case-overview.puml`, `deployment.puml`) ra thư mục tạm, 0 "Syntax Error". Mọi luồng `UC-04` mà `srs.md` dẫn chiếu đều có trong `uc-checkout.md`. Mọi mã AC mà `uc-checkout.md`, `docs/diagrams/*.puml` và ADR-005/007 dẫn chiếu đều có trong `srs.md`. Không dùng lại `AC-F15.2`, `AC-F16.2`, `AC-F16.3`, `AC-F16.7`. Không còn "ADR-007 (chưa soạn)". Link tương đối trong các file `.md` đã đổi đều trỏ tới file tồn tại (một khớp giả trong `W1-ADR-report.md` nằm trong inline code).
- 2026-10-29 21:37: chấp nhận các sửa ngoài dòng card mà W1-SRS và W1-UCDIAG đã khai ở mục 6 / mục 5 của report: vẫn nằm trong allowed paths và cần để file không tự mâu thuẫn. CR-1, CR-2 của W1-UCDIAG đã được W1-SRS giải quyết (mục 3.4 viết lại, mã AC cũ giữ nguyên). CR-3 (tên lifeline so với đề §4.2) để nhóm giải thích khi vấn đáp.
- 2026-10-29 21:37: giữ `PaymentStatus.REFUNDED` trong `srs.md` và `class-domain.puml`. Giá trị này có từ trước và FR-26 vẫn Won't. Contract mục 3 chỉ liệt kê các giá trị VNPay dùng, không chủ ý bỏ `REFUNDED`. Enum Prisma hiện chỉ có `SUCCESS`, `FAILED`; độ lệch này có từ trước và để bước 5 xử lý. Nhóm có thể bỏ khi duyệt.
- 2026-10-29 21:37: nhận tạm cách chia AC mới giữa FR-14/15/16 (W1-SRS-report mục 6) và cách ánh xạ NFR cho E9–E13 (W1-UCDIAG-report mục 5). `AC-N12.1` (E2E qua redirect VNPay) để nhóm quyết định ở bước 7. Wave 2 (`traceability-matrix.md`, quét toàn repo) chạy sau khi nhóm duyệt hoặc sau spike.
