# CR-task4: đồng bộ Task 4 với PR #11

> Chỉ mục: [`README.md`](README.md). Change request cho chủ Task 4 (branch `a2/Task4`, PR #9). PR #11 đã merge vào `develop-Assignment2` (merge commit `040dd25`).
>
> **Code trong `apps/` không phải sửa.** `apps/api/prisma/schema.prisma` đã có `Product.description` (D1); `/health` và thanh toán chưa hiện thực nên chưa chịu ảnh hưởng của D2, C2, C3.

## Vì sao cần làm

PR #9 tách ra trước PR #11 nên còn trỏ tới các tiêu chí đã bỏ (C1: AC-F16.7; C2: AC-N15.3, `version`/SHA; ngưỡng 200 ms đã bỏ ở SRS §1.4 thay đổi 5). GitHub báo PR #9 `CONFLICTING` ở `docs/traceability-matrix.md`.

**Allowed paths:** `docs/traceability-matrix.md` (dòng FR-02, NFR-15 đến NFR-18), `apps/api/README.md` (dòng 35), `docs/planning/handoff/2026-10-21-req-sync/report-task4.md`.

## Cách làm

- [ ] **T4-1.** `git switch a2/Task4 && git pull origin develop-Assignment2`. Xung đột dự kiến: chỉ `docs/traceability-matrix.md`, một khối NFR-15 đến NFR-18 (đã thử `git merge-tree`).
- [ ] **T4-2.** Giải xung đột theo CR-4.1, sửa CR-4.2 và CR-4.3, rồi `git add docs/traceability-matrix.md apps/api/README.md` và `git commit` (commit merge, message mặc định của git).
- [ ] **T4-3.** Kiểm (chạy sau commit):
  - `git diff --check origin/develop-Assignment2...HEAD` sạch;
  - `python docs/validate_task2.py` in `All static checks PASSED`;
  - `git grep -n -E "<<<<<<<|>>>>>>>|AC-F16\.7|AC-N15\.3|200 ms|version./SHA|đúng SHA|SHA bản trước" -- apps README.md docs/traceability-matrix.md` ra 0 dòng;
  - CI của PR #9 xanh sau khi push branch `a2/Task4`.
- [ ] **T4-4.** Ghi `report-task4.md` (output T4-3), commit `docs(planning): add Task 4 sync report`, push `a2/Task4`.
- [ ] **T4-5. Thứ tự merge:** PR #9 merge **sau** PR Task 3 (đề A2 §1: task sau chỉ được nghiệm thu khi tạo phẩm của task trước đã có trên repo).

## CR-4.1: Xung đột `docs/traceability-matrix.md` (NFR-15 đến NFR-18)

PR #11 sửa dòng NFR-15 và NFR-18; PR #9 sửa NFR-16 và NFR-17. Bốn dòng nằm sát nhau nên git báo một khối xung đột.

- **Giữ từ `develop-Assignment2` (PR #11):**
  - dòng NFR-15, bắt đầu bằng `| NFR-15 | Triển khai; kiểm \`GET /health\` 200/503 theo DB (AC-N15.1–2)`
  - dòng NFR-18, bắt đầu bằng `| NFR-18 | Triển khai; kiểm pipeline CD: smoke test chờ 200 có retry; rollback deploy lại image tag bản trước (AC-N18.2–3)`
- **Giữ từ `a2/Task4`:** dòng NFR-16 và NFR-17 (đường dẫn migration/seed, CI và bằng chứng PR #9/#10).
- **Lý do:** mỗi bên chỉ đúng ở dòng mình sửa; không có dòng nào cần trộn nội dung.

## CR-4.2: `apps/api/README.md:35`

- **Đoạn cũ:** `Thanh toán mô phỏng phải chống thu trùng theo \`orderId\` và phục hồi sau restart (AC-F16.7); Barista có Postman collection (AC-F24.4); health check có version/SHA và không cache (AC-N15.1–3).`
- **Đoạn mới:** `Thanh toán mô phỏng không lưu trạng thái; API chống thu trùng bằng \`Idempotency-Key\` theo chủ đơn/\`orderId\`/key/\`paymentMethod\` (BR-05, FR-16); Barista có Postman collection (AC-F24.4); health check trả 200/503 theo DB (AC-N15.1–2).`
- **Lý do:** C1 và C2; D2 định nghĩa phép so replay.

## CR-4.3: Ma trận dòng FR-02, cột Test

- **Đoạn cũ:** `... API-T04 tại \`apps/api/test/products.e2e-spec.ts\` kiểm API rỗng. Chưa đo ngưỡng loading 200 ms |`
- **Đoạn mới:** `... API-T04 tại \`apps/api/test/products.e2e-spec.ts\` kiểm API rỗng |`
- **Lý do:** SRS không có ngưỡng 200 ms. AC-F02.1 chỉ đòi có skeleton/spinner.

## Ngoài CR này

- `docs/checkpoints/2026-10-19-task4.md:66` nhắc "loading 200 ms": đây là nhật ký lịch sử, giữ nguyên.
- Cột Thiết kế/Sơ đồ cho FR-01 đến FR-03 do Task 2 điền ở T2-M (đợt 4), không làm trong PR #9.
