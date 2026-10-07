# BrewLite Frontend — Task 3 (Menu) + Task 5 (Giỏ hàng)

Phạm vi: **chỉ Task 3 và Task 5**. Không làm Task 4 (màn hình chi tiết size/topping).

## Chạy

```bash
cd frontend
cp .env.example .env.local   # sửa NEXT_PUBLIC_API_URL nếu backend không ở localhost:3000
npm install
npm run dev                  # http://localhost:3001
```

Backend Task 2 (`GET /products`) chưa chạy vẫn demo được: UI tự fallback menu mẫu
(Cà phê sữa 35k, Americano 40k, Cappuccino 45k, Trà đào 39k) và hiện banner vàng.

## Task 3 — Trang Menu (`/`)

- `src/app/page.tsx` gọi `getProducts()` (`src/lib/api.ts` → `GET /products`).
- `src/components/ProductGrid.tsx`: loading skeleton / empty / error + nút Thử lại.
- `src/components/ProductCard.tsx`: lưới sản phẩm, giá `formatVND`, trạng thái hết hàng.
- Nút "Thêm" dùng option mặc định (size M, không topping) — màn hình chọn size/topping là Task 4.

## Task 5 — Giỏ hàng (`/cart`) + thanh toán đơn giản

- Store: `src/store/cart.ts` (Zustand + persist `localStorage` key `brewlite-cart`).
- Thêm / sửa số lượng / xóa; `count` cho badge ở `Header.tsx`; `total` tự tính.
- Số lượng mỗi món giới hạn tối thiểu **>= 1**: nút trừ mờ khi đang ở 1, muốn bỏ món dùng nút Xóa.
- Thanh toán bọc sau interface `PaymentGateway` (`src/lib/payment/`), UI không dính mock hay API thật:
  - `types.ts`: `PaymentMethod`, `PaymentRequest/Result` (khớp `CreatePaymentDto` backend).
  - `mock-gateway.ts`: demo hiện tại (chờ ngắn → PAID, tự sinh mã đơn `#XXXX`).
  - `api-gateway.ts`: cắm backend Task 8 thật (`POST /payments` + header `Idempotency-Key`).
  - `gateway.ts` → `getPaymentGateway()` là ĐIỂM NỐI duy nhất, đọc `NEXT_PUBLIC_PAYMENT_MODE`.
- Đổi sang thanh toán thật sau này: backend Task 6+8 chạy được → set `NEXT_PUBLIC_PAYMENT_MODE=api`
  trong `.env.local` → xong, không sửa UI. Thanh toán lỗi thì UI ở lại màn thanh toán, giỏ giữ
  nguyên (khớp US-05: PAYMENT_FAILED + giữ giỏ).
- Mọi tiền qua `src/lib/pricing.ts` (NGUỒN DUY NHẤT):
  `unitPrice = base + SIZE_UPCHARGE[size] + sum(TOPPING_PRICES)`,
  `lineTotal = unitPrice * qty`, `cartTotal = sum(lineTotal)` — số nguyên VND.
- Key dòng giỏ = `productId|size|toppings(sort)` nên 2 option khác nhau không gộp nhầm.

## Tránh sai số với nhánh `feature/task-8-10-payment-order`

- `Product` khớp `ProductDto` + Prisma `Product`: `{ id, name, price, imageUrl, stock, version }`.
- `CartItem` khớp docs UC02 + `OrderItemDto`: `{ productId, size, toppings, quantity, unitPrice, lineTotal }`.
- Backend Task 6/8/10 khi validate `POST /orders` phải dùng **đúng** `SIZE_UPCHARGE` và
  `TOPPING_PRICES` trong `src/lib/pricing.ts`; frontend đã gửi `unitPrice` theo công thức này.
- `version` chỉ để hiển thị/hết hàng, không tự tăng phía client (optimistic-lock do backend giữ).
- Giá trị loyalty/voucher (`BREWLITE10`, 10%) thuộc Task 8/10, không tính trong giỏ.
