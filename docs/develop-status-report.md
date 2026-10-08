# Báo cáo hiện trạng nhánh `develop` — đối chiếu 10 task (Mục 8) + API (12.1) + thực thể (12.2)

> Ngày: 2026-10-08. HEAD khi viết: `d3ce731`. Phạm vi: những gì đã nâng cấp để đạt yêu cầu và những gì chưa đạt.
> Nguồn chuẩn duy nhất cho yêu cầu là `docs/BrewLite-CongNghePhanMem-fixed.md`; file này chỉ ghi trạng thái + bằng chứng, không chép lại code.

## 1. Đã đạt (đủ điều kiện tính điểm cả 10 task)

| Task | Nâng cấp | Bằng chứng (file/commit kiểm chứng) |
|---|---|---|
| 1 Khởi tạo | Có sẵn từ trước | `docker compose ps` 3 service Up; `.env.example` đầy đủ |
| 2 `GET /products` | `ProductModule`: list lọc `stock > 0`, detail 404; seed 4 món | `backend/test/order-product.spec.ts`; smoke `GET /products` → 4 món |
| 3 Menu FE | Có sẵn: skeleton loading, error + retry, empty, mock-banner | `frontend/src/components/ProductGrid.tsx`; `npm run build` sạch |
| 4 Tùy chọn món | Mới `ProductDetailModal.tsx`: Size S/M/L, 3 topping, số lượng, giá live từ `lib/pricing.ts` | commit `e14ccb6`; build sạch |
| 5 Giỏ hàng | Có sẵn Zustand + persist + badge `Header`; nối `items` sang checkout | `frontend/src/store/cart.ts`, `cart/page.tsx`; build sạch |
| 6 `POST /orders` | Mới `OrderModule` + `JwtAuthGuard`: total tính server-side, 404 sp lạ, 401 thiếu JWT | `order-product.spec.ts` (tổng 60000); smoke `PENDING` + `401` |
| 7 JWT | Mới `AuthModule`: register (409 trùng, bcrypt hash), login (401 đồng nhất), guard; trang `/login` lưu `brewlite-token` | `backend/test/auth.spec.ts` (6 test); smoke token + décret `demo@brewlite.vn/demo1234` (xem README) |
| 8 Thanh toán | Xóa `shouldSimulateFailure` khỏi DTO; voucher passthrough; checkout 2 bước `POST /orders` → `POST /payments` + `Idempotency-Key` | idempotent 1-charge, fail giữ giỏ + retry, refund thực thu; smoke thật `201 amount=40500` → replay `200` |
| 9 Bàn giao | Mới `/history` (token-gated, mới-nhất-trước); seed login demo; compose boot (migrate + seed + start); mục demo trong README; `EXTRA_TASKS.md` | demo end-to-end đã chạy qua compose: menu → login → đơn → pay → lịch sử |
| 10 Nghiệp vụ | PG adapters (`Prisma*Repo`, chọn theo `DATABASE_URL`); fix mapping `OrderItem`, restore tăng version, refund cộng dồn, hash pass-through; pin toán voucher/loyalty, guard-allow, cancel các nhánh | suite backend **36 pass + 1 pg-skip** (`npm test`); pg suite đã chạy tay trên DB thật: pass; state machine 14 test |

Thực thể (Mục 12.2): đủ 5 bảng đúng field trong `backend/prisma/schema.prisma`; migration `20261007163647_init` đã apply (`idempotencyKey @unique` có thật trong DB).

## 2. Chưa đạt / còn nợ

1. **`GET /orders` và `GET /orders/:id` chưa có** — backend live 8/10 endpoint Mục 12.1; 2 endpoint quầy (UC08–UC12, tài liệu ghi "extension ngoài MVP") chưa ai code.
2. **Frontend không có test runner** — Task 3/4/5/9-UI chỉ được bảo vệ bằng `npm run build` + smoke tay, không test tự động.
3. **pg suite mặc định skip** — chỉ chạy khi có `DATABASE_URL` (đã chạy tay 1 lần: pass toàn bộ).
4. **3 lệnh ghi sau charge chưa bọc `$transaction`** — cơ chế compensate hiện tại (hoàn tiền + `PAYMENT_FAILED`) khớp đúng note UC 2.4 trong `docs/user-sequence-specifications.md`; cửa sổ crash giữa các lệnh là rủi ro đã biết, để riêng 1 task.
5. **TailwindCSS / Passport / React Query không dùng** — quyết định có chủ ý (Mục 6 cho phép chọn: inline-style thay Tailwind, Zustand thay React Query, guard tự viết thay Passport). Không phải thiếu sót.
6. `PATCH /orders/:id` còn nằm ở `PaymentController` thay vì `OrderController` — đúng hành vi, đã test; dời khi refactor (cosmetic).

## 3. Ghi chú ngoài phạm vi 3-5-8-10

Các task của teammate do nhánh này tự code để demo (chi tiết xem `EXTRA_TASKS.md` ở root): Task 2, Task 4-UI (modal), Task 6, Task 7, Task 9 (history + compose + seed).

## 4. Chia việc qua worktree (mỗi agent 1 worktree, 1 nhánh)

Nhánh `develop` là nhánh tích hợp, không code trực tiếp. Agent nhận worktree + làm xong thì review rồi merge về `develop`.

| Worktree (thư mục) | Nhánh | Việc | Phạm vi file (cấm lấn) | Xong khi |
|---|---|---|---|---|
| `../BrewLite-wt-barista` | `feat/barista-queue` | Gap 1: `GET /orders?status=`, `GET /orders/:id` (UC08–UC12) + dời `PATCH /orders/:id` sang `OrderController` | `backend/src/order/*`, `backend/test/order-*.spec.ts`; **không đụng** `payment.service.ts` logic | 2 endpoint live + test guard/401/sort |
| `../BrewLite-wt-fe-tests` | `feat/frontend-tests` | Gap 2: dựng vitest + test `pricing.ts` (size/topping/voucher math), `cart.ts` (add/qty/total/persist key) | `frontend/**` only; **không đổi** UI/logic | `npm test` xanh trong worktree |
| `../BrewLite-wt-pay-tx` | `feat/payment-tx` | Gap 4: bọc 3 lệnh ghi sau charge trong transaction nguyên tử (giữ seam `I*Repository` cho cả InMemory + Prisma) | `payment.service.ts`, contracts, cả 2 bộ repo impl; **không đổi** hành vi API | full suite xanh + pg suite trên DB của checkout chính |
| (checkout chính `E:/CNPM/BrewLite`) | `develop` | Tích hợp: merge từng nhánh sau review; chạy demo compose; push | — | smoke E2E xanh |

Quy tắc chung:
- Tạo worktree: `git worktree add ../BrewLite-<tên> -b <nhánh> develop` (từ checkout chính, khi `develop` sạch).
- Test mặc định chạy InMemory (không cần DB) nên các agent không giẫm port; pg suite chỉ chạy ở checkout chính (DB compose `:5432`).
- Xóa worktree sau merge: `git worktree remove ../BrewLite-<tên>` + `git branch -d <nhánh>`.
- Gap 3 (pg skip mặc định) và Gap 5 (Tailwind/Passport/React Query — quyết định không làm) không cần worktree.
