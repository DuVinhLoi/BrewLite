# Kế hoạch Triển khai: Task 8 (Thanh toán) & Task 10 (Nghiệp vụ Backend) - Chuẩn Hóa 6 Mảnh Ghép

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chạy độc lập 100% Task 8+10 bằng Stub In-Memory, pass 3 tiêu chí a/b/c, merge develop chỉ đổi provider.

**Architecture:** Interface-First (contracts seam) + deep PaymentService + adapters InMemory/Prisma, bám UC04+UC06.

**Tech Stack:** NestJS + TypeScript + Jest + class-validator + Prisma/PostgreSQL (tương lai).

## Global Constraints

- Workspace: nhánh `feature/task-8-10-payment-order` (isolated, không code trên develop/main).
- Đúng 5 entity tối thiểu, đúng 7 endpoint gốc + `PATCH /orders/:id` suy ra, voucher `BREWLITE10` nội bộ.
- TDD Red-Green bắt buộc, verification-before-completion trước mỗi commit.
- Review checkpoints sau Task 2, Task 4, Task 6 + requesting-code-review trước merge develop.

> **Tài liệu tham chiếu thiết kế (Mapping chuẩn):**
> - **Bản nộp báo cáo giảng viên:** 3 sơ đồ rút gọn tại [docs/BrewLite-CongNghePhanMem-fixed.md](file:///e:/CNPM/BrewLite/docs/BrewLite-CongNghePhanMem-fixed.md) (Wireframe 5 màn hình, State Machine Mục 9.1).
> - **Bản triển khai kỹ thuật (Developer Appendix):** [docs/user-sequence-specifications.md](file:///e:/CNPM/BrewLite/docs/user-sequence-specifications.md):
>   - **Trọng tâm 85%:** [Mục 2.4: UC04 + UC05 + UC05a](file:///e:/CNPM/BrewLite/docs/user-sequence-specifications.md#24-uc04--uc05--uc05a-đặt-hàng--thanh-toán-không-tiền-mặt) (Dòng 232-327) cho API `POST /payments` và 4 yêu cầu của Task 10.
>   - **Bổ trợ 15%:** [Mục 2.5: UC06: Hủy đơn & Thử lại](file:///e:/CNPM/BrewLite/docs/user-sequence-specifications.md#25-uc06-hủy-đơn--thử-lại-thanh-toán) (Dòng 330-407) cho máy trạng thái và `PATCH /orders/:id`.

---

## 1. Khung Ràng Buộc & Quyết Định Thiết Kế (6 Cải Thiện Bắt Buộc)

1. **Contracts Seam (`src/contracts/`):**
   - Khai báo đầy đủ các interface `IOrderRepository`, `IProductRepository`, `IPaymentRepository`, `IUserRepository`.
   - Khai báo enum `OrderStatus` chuẩn 100% theo `docs:301-322` và `docs/user-sequence-specifications.md`.
   - `Product` có trường `version: number` và `stock: number`.
   - **Tác dụng:** Khi đồng đội code xong Task 1-7 và merge vào `develop`, ta chỉ cần đổi 1 dòng provider trong `PaymentModule` từ `InMemory*` sang `Prisma*Service`.
2. **Khóa Voucher + Entity (Không đẻ bảng ngoài CSDL):**
   - Giữ nguyên CSDL chuẩn 5 thực thể tối thiểu (`Product`, `User`, `Order`, `OrderItem`, `Payment`).
   - Mã `BREWLITE10` (-10%) được **validate nội bộ trực tiếp trong `PaymentService`**. Tuyệt đối không tạo bảng `Promotion`/`Voucher`, không thêm endpoint ngoài 7 endpoint gốc.
3. **Chi tiết hóa Task 10 thành 4 dòng nghiệp vụ có kiểm thử tương ứng:**
   - **State Machine (Tiêu chí a):** `assertTransition` kiểm soát ma trận trạng thái đầy đủ. Test file: `src/state-machine/order-state.machine.spec.ts`.
   - **Idempotency (Tiêu chí b):** Kiểm tra `Idempotency-Key` (Cache Hit trả 200 kết quả cũ không gọi Gateway, Cache Miss gọi Gateway). Test file: `test/order-payment.integration.spec.ts`.
   - **Concurrency (Tiêu chí c):** Optimistic Locking trên cột `version`, retry tối đa 3 lần với exponential backoff, ném `ConflictException (409)` khi hết hàng. Test file: `test/order-payment.integration.spec.ts` dùng `Promise.all()`.
   - **Loyalty:** Tích lũy 10% số tiền thực trả (1 điểm = 1.000 VNĐ), cộng vào `User.loyaltyPoints` ngay khi đơn sang `PAID`.
4. **Bổ sung toàn vẹn Luồng Hủy / Thử lại (UC06 - Mục 2.5):**
   - Thêm `PATCH /orders/:id` xử lý cập nhật trạng thái `CANCELLED`:
     - `PENDING` $\rightarrow$ `CANCELLED`: Hủy đơn chưa thanh toán.
     - `PAID` $\rightarrow$ `CANCELLED`: Hủy đơn đã trả tiền $\rightarrow$ Kích hoạt `MockPaymentGateway.refund()` hoàn tiền và hoàn lại tồn kho `stock`.
     - `PREPARING` / `COMPLETED` $\rightarrow$ `CANCELLED`: Chặn và ném lỗi `BadRequestException (400)`.
   - Hỗ trợ `POST /payments` thử lại khi đơn ở trạng thái `PAYMENT_FAILED` (`PAYMENT_FAILED` $\rightarrow$ `PENDING` $\rightarrow$ `PAID`).
5. **Chuẩn hóa DTO & Curl Test & Bảng mã lỗi HTTP:**
   - Client gửi `POST /payments`: `{ orderId, method, voucherCode?, shouldSimulateFailure? }` (kèm Header `Idempotency-Key`).
   - `amount` **không do client gửi** mà được backend suy ra từ `order.total - discount` để tránh khách hàng can thiệp sửa giá.
   - Giải thích số liệu mẫu: Đơn 35.000đ, áp `BREWLITE10` (-10% = 3.500đ) $\rightarrow$ Thực trả: 31.500đ $\rightarrow$ Điểm tích lũy: 3 điểm (10% của 31.500đ = 3.150đ làm tròn 3 điểm).
   - Thêm cờ `shouldSimulateFailure: true` trong `MockPaymentGatewayService` để kiểm thử kịch bản thanh toán thất bại.
   - **Bảng mã lỗi HTTP:**
     | HTTP Code | Trường hợp |
     | :--- | :--- |
     | **`201 Created`** | Thanh toán mới thành công lần đầu (`Cache Miss`), chuyển đơn sang `PAID`. |
     | **`200 OK`** | (1) Khóa `Idempotency-Key` trùng lặp (`Cache Hit`), trả kết quả cũ.<br>(2) Hủy đơn (`PATCH /orders/:id`) thành công. |
     | **`400 Bad Request`** | (1) Vi phạm chuyển trạng thái máy trạng thái (ví dụ `PREPARING` $\rightarrow$ `CANCELLED`).<br>(2) Thiếu `Idempotency-Key` hoặc dữ liệu DTO không hợp lệ.<br>(3) Cổng thanh toán từ chối giao dịch (chuyển đơn sang `PAYMENT_FAILED`). |
     | **`404 Not Found`** | Không tìm thấy `orderId` hoặc `productId`. |
     | **`409 Conflict`** | Xung đột tồn kho do mua đồng thời (Optimistic Lock thất bại sau 3 lần retry) hoặc sản phẩm đã hết hàng. |
6. **Chỉ dẫn sơ đồ UML đối chiếu:**
   - Báo cáo đồ án nộp giáo viên: Dùng 3 sơ đồ chuẩn tại [docs/BrewLite-CongNghePhanMem-fixed.md](file:///e:/CNPM/BrewLite/docs/BrewLite-CongNghePhanMem-fixed.md).
   - Bản lập trình & kiểm thử: Bám sát Mục 2.4 và Mục 2.5 tại [docs/user-sequence-specifications.md](file:///e:/CNPM/BrewLite/docs/user-sequence-specifications.md).

---

## 2. Bản Đồ Cấu Trúc Tệp (File Structure Map)

```
backend/
├── package.json                                   # NestJS, TypeScript, Jest, class-validator, uuid
├── tsconfig.json
├── jest.config.js
├── prisma/
│   └── schema.prisma                              # Schema chuẩn 5 thực thể (version, idempotencyKey, loyaltyPoints)
├── src/
│   ├── contracts/                                 # [MẢNH 1] Hợp đồng kết nối độc lập
│   │   ├── order.contract.ts                      # OrderStatus enum & IOrderRepository
│   │   ├── product.contract.ts                    # ProductDto (stock, version) & IProductRepository
│   │   ├── payment.contract.ts                    # PaymentDto & IPaymentRepository
│   │   └── user.contract.ts                       # UserDto (loyaltyPoints) & IUserRepository
│   ├── state-machine/                             # [MẢNH 3 - Tiêu chí a]
│   │   ├── order-state.machine.ts                 # assertTransition(from, to)
│   │   └── order-state.machine.spec.ts            # Unit Test kiểm soát trạng thái
│   ├── payment/                                   # [MẢNH 2, 4, 5] Thanh toán & Hủy/Thử lại
│   │   ├── dto/
│   │   │   ├── create-payment.dto.ts              # DTO validate POST /payments
│   │   │   └── update-order-status.dto.ts         # DTO validate PATCH /orders/:id (Hủy đơn)
│   │   ├── mock-payment-gateway.service.ts        # charge() & refund() kèm cờ shouldSimulateFailure
│   │   ├── payment.service.ts                     # Core: Idempotency, Voucher nội bộ, Optimistic Lock, Loyalty
│   │   ├── payment.controller.ts                  # Endpoints: POST /payments, PATCH /orders/:id
│   │   └── payment.module.ts                      # Module đóng gói dependency injection
│   ├── stubs/                                     # Bộ điều hợp In-Memory chạy độc lập
│   │   ├── in-memory-order.repo.ts
│   │   ├── in-memory-product.repo.ts
│   │   ├── in-memory-payment.repo.ts
│   │   └── in-memory-user.repo.ts
│   ├── app.module.ts                              # AppModule gốc
│   └── main.ts                                    # Khởi chạy server thật lắng nghe cổng 3000
└── test/
    └── order-payment.integration.spec.ts          # [MẢNH 3 - Tiêu chí b & c] Promise.all Concurrency & Idempotency
```

---

## 3. Các Bước Triển Khai Chi Tiết (Bite-Sized Tasks)

### Task 1: Thiết lập Contracts & Prisma Schema (Mảnh 1 & 2)

**Files:**
- Create: `backend/src/contracts/order.contract.ts`
- Create: `backend/src/contracts/product.contract.ts`
- Create: `backend/src/contracts/payment.contract.ts`
- Create: `backend/src/contracts/user.contract.ts`
- Create: `backend/prisma/schema.prisma`

**Interfaces:**
- Consumes: docs `BrewLite-fixed.md:301-322,360-364` + UC04/UC06.
- Produces: `OrderStatus, OrderDto/IOrderRepository, ProductDto/IProductRepository, PaymentDto/IPaymentRepository, UserDto/IUserRepository` cho Task 2-6.

- [x] **Step 1.1: Tạo các Interfaces hợp đồng** *(Xong — `backend/src/contracts/*.contract.ts`; về sau mở rộng (transaction, `findByUserId`…) ở a209b88)*

Khai báo `backend/src/contracts/order.contract.ts`:
```typescript
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  items: OrderItemDto[];
  createdAt: Date;
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderDto | null>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderDto>;
  save(order: OrderDto): Promise<OrderDto>;
}
```

Khai báo `backend/src/contracts/product.contract.ts`:
```typescript
export interface ProductDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  version: number; // Optimistic locking version
}

export interface IProductRepository {
  findById(id: string): Promise<ProductDto | null>;
  deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number): Promise<boolean>;
  restoreStock(id: string, quantity: number): Promise<void>;
  save(product: ProductDto): Promise<ProductDto>;
}
```

Khai báo `backend/src/contracts/payment.contract.ts`:
```typescript
export type PaymentMethod = 'WALLET' | 'CARD';
export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface PaymentDto {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
}

export interface IPaymentRepository {
  findByIdempotencyKey(key: string): Promise<PaymentDto | null>;
  save(payment: PaymentDto): Promise<PaymentDto>;
}
```

Khai báo `backend/src/contracts/user.contract.ts`:
```typescript
export interface UserDto {
  id: string;
  email: string;
  loyaltyPoints: number;
}

export interface IUserRepository {
  findById(id: string): Promise<UserDto | null>;
  addLoyaltyPoints(id: string, points: number): Promise<UserDto>;
  save(user: UserDto): Promise<UserDto>;
}
```

- [x] **Step 1.2: Định nghĩa Prisma Schema đúng 5 thực thể tối thiểu (Không đẻ bảng ngoài)** *(Xong — `backend/prisma/schema.prisma`: đúng 5 model)*

Viết `backend/prisma/schema.prisma` với đúng 5 model: `User`, `Product`, `Order`, `OrderItem`, `Payment`.

---

### Task 2: Order State Machine & Test Suite a (Mảnh 3 & 4)

**Files:**
- Create: `backend/src/state-machine/order-state.machine.ts`
- Create: `backend/src/state-machine/order-state.machine.spec.ts`

**Interfaces:**
- Consumes: Task 1 `OrderStatus`.
- Produces: `assertTransition(from,to)` cho Task 4/6. Chạy song song được với Task 3.

- [x] **Step 2.1: Viết Unit Test `order-state.machine.spec.ts` (Tiêu chí a)** *(Xong — `order-state.machine.spec.ts`; assert mới chỉ `.toThrow()`, chưa kiểm loại exception)*
  - Kiểm thử cho phép: `PENDING -> PAID`, `PENDING -> PAYMENT_FAILED`, `PAYMENT_FAILED -> PENDING`, `PENDING -> CANCELLED`, `PAID -> CANCELLED`, `PAID -> PREPARING`, `PREPARING -> READY`, `READY -> COMPLETED`.
  - Kiểm thử ném `BadRequestException`: `PREPARING -> CANCELLED`, `COMPLETED -> CANCELLED`, `PENDING -> COMPLETED`, `COMPLETED -> PENDING`.
- [ ] **Step 2.2: Chạy test để xem FAIL đỏ (TDD Red)**
- [x] **Step 2.3: Hiện thực hóa `order-state.machine.ts` với ma trận chuyển đổi** *(Xong — `order-state.machine.ts`, đủ 9 mũi tên §9.1)*
- [x] **Step 2.4: Chạy test `npm test -- order-state.machine.spec.ts` (PASS xanh) + commit. Checkpoint review 1.** *(Xong — commit d1be546; không thấy dấu vết "checkpoint review 1")*

---

### Task 3: Mock Payment Gateway & In-Memory Stubs (Mảnh 1, 4, 5)

**Files:**
- Create: `backend/src/payment/mock-payment-gateway.service.ts`
- Create: `backend/src/stubs/in-memory-order.repo.ts`
- Create: `backend/src/stubs/in-memory-product.repo.ts`
- Create: `backend/src/stubs/in-memory-payment.repo.ts`
- Create: `backend/src/stubs/in-memory-user.repo.ts`

**Interfaces:**
- Consumes: Task 1 contracts.
- Produces: `charge()/refund()/getCallCount()` + stub repos cho Task 4-6. Chạy song song được với Task 2 (dispatch 2 agents).

- [x] **Step 3.1: Viết MockPaymentGatewayService** *(Xong, đã đổi: 34a062b bỏ cờ DTO `shouldSimulateFailure`, thay bằng hook `failNextCharge`; gateway có thêm `refund`, `getCallCount`)*
  - Cung cấp hàm `charge({ amount, method, shouldSimulateFailure })`.
  - Cung cấp hàm `refund(orderId, amount)`.
  - Cung cấp bộ đếm `getCallCount()` để test Idempotency.
- [x] **Step 3.2: Viết các In-Memory Repositories** *(Xong — `backend/src/stubs/in-memory-*.repo.ts`; a209b88 thêm `in-memory-tx.ts`)*
  - Lưu trữ dữ liệu RAM, hiện thực hàm `deductStockWithOptimisticLock` so sánh `version` nguyên tử và `restoreStock`.

---

### Task 4-RED (TDD bắt buộc, làm trước Task 4): Viết failing integration test

**Files:**
- Create: `backend/test/order-payment.integration.spec.ts` (khung fail)

**Interfaces:**
- Consumes: Task 1-3 signatures.
- Produces: 3 test đỏ cho Task 4 implement.

- [ ] **Step 4-RED.1: Viết test b (Idempotency), test c (Concurrency stock=1, Promise.all), test hủy/hoàn tiền UC06** *(Chưa tick: test (b) có; test (c) dùng 10 đơn/stock=3 và chưa assert `ConflictException`/409; chưa có test hủy PREPARING→400 ở tầng service)*
- [ ] **Step 4-RED.2: Chạy `npm test` xác nhận FAIL (chưa có PaymentService)**

### Task 4: Triển khai PaymentService Hoàn Chỉnh (Mảnh 2, 4, 5)

**Files:**
- Create: `backend/src/payment/dto/create-payment.dto.ts`
- Create: `backend/src/payment/dto/update-order-status.dto.ts`
- Create: `backend/src/payment/payment.service.ts`

**Interfaces:**
- Consumes: Task 1 contracts + Task 2 `assertTransition` + Task 3 gateway/stubs.
- Produces: `processPayment(dto,key)/cancelOrder(id)` cho Task 5/6.

- [x] **Step 4.1: Định nghĩa DTO** *(Xong, đã đổi: `method`→`paymentMethod`; bỏ `shouldSimulateFailure` (34a062b); `update-order-status.dto.ts` nhận 4 trạng thái (7f2346b))*
  - `CreatePaymentDto`: `{ orderId, method, voucherCode?, shouldSimulateFailure? }`.
  - `UpdateOrderStatusDto`: `{ status: OrderStatus }`.
- [ ] **Step 4.2: Hiện thực hóa `PaymentService`** *(Chưa tick: `processPayment`/`cancelOrder` đã làm, nhưng thiếu lưu biên lai FAILED (bước 5) và exponential backoff (bước 7) — sequence spec không đòi hai điểm này)*
  - **Hàm `processPayment(dto, idempotencyKey)`:**
    1. Kiểm tra `idempotencyKey` trong repo. Nếu Hit $\rightarrow$ Trả về kết quả cũ (HTTP 200), không gọi Gateway.
    2. Lấy đơn hàng, tính `discount` nếu mã là `BREWLITE10` (-10%).
    3. `finalAmount = Math.max(0, order.total - discount)`.
    4. Nếu đơn đang ở `PAYMENT_FAILED` (khách thử lại), gọi `assertTransition(PAYMENT_FAILED, PENDING)`.
    5. Gọi `mockGateway.charge()`. Nếu thất bại $\rightarrow$ `assertTransition(order.status, PAYMENT_FAILED)`, lưu biên lai FAILED, ném lỗi `BadRequestException`.
    6. Nếu thành công $\rightarrow$ `assertTransition(order.status, PAID)`.
    7. Trừ kho Optimistic Locking với `version`: retry 3 lần, ném `ConflictException (409)` nếu hết hàng.
    8. Cộng điểm Loyalty: `points = Math.floor(finalAmount * 0.1 / 1000)`.
    9. Lưu Payment record kèm `idempotencyKey`.
  - **Hàm `cancelOrder(orderId)` (UC06 Kịch bản 2 & 3):**
    1. Lấy đơn hàng, kiểm tra `assertTransition(order.status, CANCELLED)`.
    2. Nếu đơn đang ở `PAID` $\rightarrow$ gọi `mockGateway.refund()`, hoàn lại tồn kho `productRepo.restoreStock()`.
    3. Đổi trạng thái đơn sang `CANCELLED`.

---

### Task 5: PaymentController & Server Khởi Chạy (Mảnh 5)

**Files:**
- Create: `backend/src/payment/payment.controller.ts`
- Create: `backend/src/payment/payment.module.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/src/main.ts`

**Interfaces:**
- Consumes: Task 4 `processPayment/cancelOrder`.
- Produces: `POST /payments + PATCH /orders/:id` cho Task 6 verify. Checkpoint review 2 sau Task 4+5.

- [x] **Step 5.1: Viết `PaymentController`** *(Xong — `payment.controller.ts`; thêm `JwtAuthGuard` ở b6a2f76)*
  - `POST /payments`: Nhận Header `Idempotency-Key` và Body `CreatePaymentDto`. Trả về mã HTTP 201 (mới), 200 (cache hit).
  - `PATCH /orders/:id`: Nhận Body `UpdateOrderStatusDto`. Trả về 200 (hủy thành công).
- [x] **Step 5.2: Cấu hình `PaymentModule`, `AppModule`, `main.ts`** *(Xong, đã đổi: `payment.module.ts` chọn repo Prisma khi có `DATABASE_URL` (5fa3272))*
  - Nạp các Stub Repositories làm provider. Khởi động server trên port 3000.

---

### Task 6-GREEN: Verify integration tests + curl (Mảnh 3 - Tiêu chí b & c)

**Files:**
- Modify: `backend/test/order-payment.integration.spec.ts` (đã viết đỏ ở Task 4-RED)

**Interfaces:**
- Consumes: Task 4-5 implementation.
- Produces: evidence pass + checkpoint review 3 + requesting-code-review trước merge.

- [ ] **Step 6.1: Viết Integration Test Suite** *(Chưa tick: (b) có; (c) lệch như 4-RED.1; test "cancel PAID refunds stock, PREPARING blocks" không có đơn PREPARING (ca này chỉ được chặn ở unit test state machine))*
  - **Tiêu chí (b) Idempotency:** Gửi 2 request có cùng `Idempotency-Key` $\rightarrow$ `mockGateway.getCallCount()` đúng bằng 1, kết quả lần 2 trả về `isCached: true`, điểm loyalty không bị cộng trùng.
  - **Tiêu chí (c) Concurrency Optimistic Lock:** Dùng `Promise.all()` cho 2 khách cùng mua sản phẩm cuối cùng (stock = 1) $\rightarrow$ đúng 1 request thành công (HTTP 201), 1 request nhận lỗi `ConflictException (409)`, stock cuối cùng = 0 (tuyệt đối không âm kho).
  - **Kiểm thử Hủy & Hoàn tiền (UC06):** Đơn `PAID` hủy thành công $\rightarrow$ chuyển `CANCELLED`, kho được hoàn lại. Đơn `PREPARING` hủy $\rightarrow$ ném lỗi 400.
- [x] **Step 6.2: Chạy kiểm thử toàn bộ `npm test` (PASS 100%)** *(Xong 2026-10-09 — backend `jest` 69/69 với Postgres thật (suite pg chạy 2 lần liên tiếp đều pass), frontend `vitest` 71/71)*
- [x] **Step 6.3: Kiểm thử thủ công bằng curl thực tế trên cổng 3000** *(Xong 2026-10-09 — curl thật cổng 3000 nối Postgres: trả 2 lần cùng key → 201 rồi 200 `isCached:true`, 1 biên lai, kho 10→9, điểm +4; hủy PAID hoàn kho 9→10; hủy PREPARING → 400)*
