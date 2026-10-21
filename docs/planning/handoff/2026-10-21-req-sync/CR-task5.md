# CR-task5: đồng bộ Task 5 với PR #11

> Change request cho chủ Task 5 (branch `feat/assignment2-task5`), Card C của [kế hoạch 2026-10-21](../../2026-10-21-req-sync-sprint2-scope-plan.md). PR #11 đã merge vào `develop-Assignment2` (merge commit `040dd25`).
>
> CR này chỉ nêu việc cần đổi. Code Task 5 do nhóm tự viết (`.claude/rules/doc-code-sync.md`); agent chỉ hỗ trợ code khi được yêu cầu rõ.

## Tóm tắt ảnh hưởng

PR #11 **giảm** việc cho Task 5:

- Không cần bảng lưu kết quả của simulator.
- Không cần logic phục hồi E8b và integration test gây crash giữa bước 13 và 14.
- Không cần `APP_VERSION`, build-arg SHA, script chờ `/health.version` và việc so SHA khi rollback.

Hai quyết định Task 5 phải hiện thực:

- **D1:** API `GET /products/:id` trả `description` (đã có trong schema Task 4).
- **D2:** cache replay thanh toán so **chủ đơn + `orderId` + `Idempotency-Key` + `paymentMethod`**. Cùng key nhưng khác `paymentMethod` sau khi đơn đã `PAID` thì trả 409 `ORDER_NOT_PAYABLE` và không gọi simulator.

Nguồn: `docs/requirements/srs.md` mục 1.4 (thay đổi 6, 7), mục 3.4, BR-05, AC-F16.1, AC-N15.1–2, AC-N18.2–3.

## CR-5.0: Không merge thẳng branch cũ

`git merge-tree` giữa `feat/assignment2-task5` và `develop-Assignment2` báo **7 xung đột** modify/delete. Develop đã xóa `backend/`, `frontend/` và thay `docker-compose.yml`, trong khi branch Task 5 sửa chính các file đó.

- **Đề xuất:** khi PR #9 (Task 4) đã merge, tạo branch mới từ `develop-Assignment2`, lấy `apps/api` và `apps/web` của Task 4 làm khung, rồi chép có chọn lọc phần logic A1 còn dùng được: auth/JWT, tính giá, giỏ hàng, payment mock, test.
- **Lý do:** đúng với mục 1 "Mâu thuẫn đầu vào" trong chính plan Task 5 ("không merge nguyên nhánh Task 5 cũ để thay thế Task 4 A2").

## CR-5.1: `docs/planning/2026-10-21-task5-minimum-alignment-plan.md`

| Dòng | Đoạn cũ (rút gọn) | Đoạn mới | Lý do |
|---|---|---|---|
| 44 | `health đúng SHA, smoke và một lần diễn tập rollback` | `health 200/503 theo DB, smoke chờ 200 và một lần diễn tập rollback` | C2 |
| 47 | `Đặc biệt giữ T1 đặt đơn/giữ kho, Payment FAILED, phục hồi E8b, JWT 1 giờ, health có SHA và production.` | `Đặc biệt giữ T1 đặt đơn/giữ kho, Payment FAILED, JWT 1 giờ và production. E8b là rủi ro chấp nhận, health không có SHA (SRS mục 1.4, thay đổi 6–7).` | C1, C2 |
| 117 | `200 {status:"ok",database:"up",version}; 503 {status:"error",database:"down",version}; no-store` | `200 { "status": "ok", "database": "up" }; 503 { "status": "error", "database": "down" }` | AC-N15.1–2 |
| 125 | `Simulator commit độc lập T2 để chịu được lỗi E8b.` | `Simulator không lưu trạng thái; API dừng trước commit T2 thì đơn vẫn PENDING, khách thanh toán lại (rủi ro chấp nhận, SRS 3.4).` | C1 |
| 153 | `thống nhất port và tên biến CORS_ORIGINS, APP_VERSION` | `thống nhất port và tên biến CORS_ORIGINS` | C2 |
| 230 | `Produces: Contract payment §2.3, phục hồi E8b, quyền staff/customer đúng SRS.` | `Produces: Contract payment §2.3, replay theo chủ đơn/orderId/key/paymentMethod (D2), quyền staff/customer đúng SRS.` | C1, D2 |
| 232 | `bảng simulator + uniqueness SUCCESS` | `uniqueness SUCCESS mỗi order (không có bảng simulator)` | C1 |
| 234–235 | Simulator lưu kết quả thành công bền vững; integration test gây lỗi sau simulator commit rồi restart | Xóa hai bước. Thêm: `Integration test replay: cùng key + cùng paymentMethod trả 200 cùng paymentId, simulator gọi 1 lần (AC-F16.1); cùng key khác paymentMethod sau PAID trả 409 (D2); key mới sau PAID trả 409 (AC-F16.4).` | C1, D2 |
| 237 | `không gọi refund để thay thế phục hồi E8b` | `không gọi refund` | C1 |
| 241 | `không thu trùng ở E8b` | `không thu trùng khi replay hoặc đơn đã PAID` | C1 |
| 279 | `scripts/wait-api-version.ps1` trong danh sách Files | Bỏ file này | C2 |
| 283 | `Health trả version/error/no-store chuẩn; … Dockerfile ARG APP_VERSION=local …` | `Health trả {status, database} 200/503, có test DB không hoạt động.` | C2 |
| 286 | `resolve tag tới commit để APP_VERSION/tag image là SHA commit thật` | `resolve tag tới commit để tag image là SHA commit thật` | C2; đề §7.3 mục 2 vẫn đòi image tag SHA |
| 288 | Poll health, `chỉ chấp nhận HTTP200/database up/version đúng SHA`, rồi smoke retry ~2 phút | `Smoke /health, GET /products và trang web; retry tới khi 200, tối đa 10 phút; quá hạn thì pipeline đỏ (AC-N18.2).` | C2 |
| 289 | `dùng SHA đích rollback để chờ/kiểm` | `deploy lại image tag SHA bản trước và web deployment trước, rồi chạy lại smoke (AC-N18.3)` | C2 |
| 303–304 | `smoke đúng phiên bản`; `ghi cả version trước/sau` | `smoke đạt`; `ghi image tag trước/sau` | C2 |
| 317 | `PG transaction/recovery` | `PG transaction, replay idempotency` | C1 |
| 323 | `SHA đúng, rollback đã thử` | `image tag SHA, smoke đạt, rollback đã thử` | C2 |

## CR-5.2: Code đang có trên branch nhưng lệch SRS/ADR

| Vị trí | Hiện trạng | Đề xuất | Căn cứ |
|---|---|---|---|
| `backend/src/health/health.controller.ts` | 503 trả `status: 'unavailable'` | `status: 'error'` | AC-N15.2 |
| `backend/src/order/order.service.ts`, `contracts/order.contract.ts` | Idempotency-Key cho `POST /orders` | Bỏ (plan dòng 252 cũng đã định bỏ) | SRS mục 8, ý 6 |
| `backend/src/contracts/product.contract.ts` | Cột `version`, `deductStockWithOptimisticLock` | Trừ kho bằng `UPDATE … SET stock = stock - n WHERE id = … AND stock >= n` trong transaction T1 | ADR-005 mục D; class diagram không có `version` |
| `product.contract.ts` `setStockWithOptimisticLock` (UC14) | Chỉnh tồn kho trực tiếp | Không đưa vào A2 | FR-29 Won't |
| Cache replay thanh toán | So theo key | So chủ đơn + `orderId` + key + `paymentMethod` | D2, BR-05, AC-F16.1 |

## CR-5.3: Cấu trúc thư mục `apps/webs` cần chốt

Plan Task 5 (dòng 7, 92) chọn `apps/webs` theo yêu cầu người dùng của phiên đó và ghi đây là ngoại lệ có chủ đích. Tuy nhiên:

- đề A2 §6.1 và §9 ghi `apps/web`;
- Task 4 đã có `apps/web` (PR #9), cùng CI;
- dòng 94 của chính plan cấm giữ song song `apps/web` và `apps/webs`.

**Đề xuất:** dùng `apps/web`. Nếu nhóm vẫn chọn `apps/webs`, phải đổi tên trong PR Task 4 hoặc ghi ADR trước khi Task 5 bắt đầu. Đây là quyết định của nhóm; CR này không tự đổi.

## CR-5.4: Truy vết

- `docs/task5-traceability.md` dùng UC01–UC07 của A1 và ghi "Requirement-ID mapping is BLOCKED". **Đề xuất:** bỏ file này; ghi trực tiếp vào cột Code/API và Test của `docs/traceability-matrix.md` theo mã `FR-xx`/`NFR-xx` và `UC-04`.
- Mỗi PR Task 5 chỉ sửa các dòng ma trận của phần mình làm, để tránh xung đột với PR khác.

## Kiểm sau khi áp CR

- `git grep -n "E8b\|AC-F16.7\|APP_VERSION\|version.*SHA\|wait-api-version" -- docs/planning/2026-10-21-task5-minimum-alignment-plan.md` chỉ còn các câu ghi E8b là rủi ro chấp nhận.
- `git merge-tree --write-tree --name-only <branch Task 5 mới> origin/develop-Assignment2` không có `CONFLICT`.
