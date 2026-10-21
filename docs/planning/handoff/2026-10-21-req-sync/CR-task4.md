# CR-task4: đồng bộ Task 4 với PR #11

> Change request cho chủ Task 4 (branch `a2/Task4`, PR #9), Card C của [kế hoạch 2026-10-21](../../2026-10-21-req-sync-sprint2-scope-plan.md). PR #11 đã merge vào `develop-Assignment2` (merge commit `040dd25`).
>
> **Code `apps/` không phải sửa.** `apps/api/prisma/schema.prisma` đã có `Product.description` (D1); `/health` chưa hiện thực nên chưa chịu ảnh hưởng của C2.

## Vì sao cần làm

PR #11 chốt bốn quyết định:

- **D1:** `Product.description` có trong SRS 3.6 và class diagram.
- **D2:** gửi lại thanh toán được coi là cùng một yêu cầu khi trùng chủ đơn, `orderId`, `Idempotency-Key` và `paymentMethod`.
- **C1:** bỏ AC-F16.7 và luồng phục hồi E8b.
- **C2:** bỏ AC-N15.3; `/health` không còn trả `version` = SHA.

Lý do ghi ở SRS mục 1.4, thay đổi (6) và (7). PR #9 đang trỏ tới các tiêu chí đã bỏ, và sẽ xung đột với develop ở một chỗ.

## Cách làm

1. Trên `a2/Task4`, chạy `git pull origin develop-Assignment2`.
2. Giải xung đột theo CR-4.1, rồi sửa tiếp CR-4.2 và CR-4.3 trong cùng commit merge hoặc một commit ngay sau đó.
3. Kiểm:
   - `git diff --check`
   - `python docs/validate_task2.py` (phải báo `All static checks PASSED`)
   - `git grep -n "AC-F16.7\|AC-N15.3\|200 ms" -- apps docs/traceability-matrix.md` không còn dòng nào
4. **Thứ tự merge:** PR #9 merge **sau** khi Task 3 (Card B) đã vào `develop-Assignment2`. Đề A2 §1: task sau chỉ được nghiệm thu khi tạo phẩm của task trước đã có trên repo.

## CR-4.1: Xung đột `docs/traceability-matrix.md` (NFR-15 đến NFR-18)

PR #11 sửa dòng NFR-15 và NFR-18; PR #9 sửa NFR-16 và NFR-17. Bốn dòng nằm sát nhau nên git báo một khối xung đột.

- **Giữ từ develop (PR #11):**
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
- **Lý do:** SRS không có ngưỡng 200 ms. AC-F02.1 chỉ đòi có skeleton/spinner; ngưỡng thời gian giao diện đã bỏ ở SRS mục 1.4, thay đổi (5).

## Ngoài CR này

- Điền cột Thiết kế/Sơ đồ cho FR-01 đến FR-03 (`Class-01`: `Product`, gồm `description`; `Activity-01`) nên gộp vào PR riêng điền toàn bộ các ô "chờ Task 2", làm **sau** khi PR #9 merge. Làm chung bây giờ sẽ xung đột thêm với PR #9.
- Branch protection (AC-N17.2) vẫn là việc của chủ repo; CR này không đổi tiêu chí đó.
