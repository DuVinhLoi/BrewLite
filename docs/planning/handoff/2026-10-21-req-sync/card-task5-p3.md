# Card Task 5 – Người 3: tóm tắt đơn và lỗi tại ô thẻ ở màn thanh toán

> Chỉ mục: [`README.md`](README.md). Thuộc Task 5, Pha B. Chỉ bắt đầu khi chủ Task 5 báo Pha A xong (CR-task5 mục CR-5.0).
>
> Người làm tự viết code và test, giải thích được từng dòng khi vấn đáp.

**Branch:** `a2/task5-p3-checkout`, tạo từ `origin/feat/assignment2-task5-delivery` **sau Pha A**. PR mở vào `feat/assignment2-task5-delivery`, không vào `develop-Assignment2`.

**Allowed paths:**
- `apps/web/src/components/shop/CheckoutScreen.tsx` (cả dòng 77, chuyển từ CR-5.2 sang card này)
- `apps/web/src/components/shop/CheckoutScreen.test.tsx` (tạo mới)

## Yêu cầu (SRS và use-case trên `develop-Assignment2`)

- **UC-04 bước 2** (`docs/requirements/uc-checkout.md:94`): màn Thanh toán có tóm tắt các dòng, tổng tiền, lựa chọn Ví/Thẻ.
- **AC-F14.5:** chọn Thẻ mà số thẻ demo không đủ 16 chữ số thì giao diện **báo lỗi tại ô** và không gọi API.
- **C3:** thanh toán chỉ còn lỗi 402 `PAYMENT_DECLINED`; không còn 502.

## Hiện trạng

- `CheckoutScreen.tsx:90` chỉ hiển thị tổng tiền, không có các dòng.
- `CheckoutScreen.tsx:55` đưa lỗi thẻ vào vùng `role="alert"` chung của trang.
- `CheckoutScreen.tsx:77` bắt `[402, 502]`.
- API đã trả đủ dòng đơn: `order.items` có `id`, `name`, `size`, `toppings`, `quantity`, `unitPrice`, `lineTotal` (`checkout.service.ts:32`).

## Các bước

- [ ] **P3-1. Test đỏ trước** trong `CheckoutScreen.test.tsx` (mẫu: `MenuScreen.test.tsx`; mock `useShop`, `useRouter`, `shopApi`):
  - chọn Thẻ, nhập `1234`, bấm "Xác nhận trả" → ô "Số thẻ demo" có `aria-invalid="true"`, thông báo lỗi nằm cạnh ô, `shopApi` không được gọi;
  - sửa số thẻ hoặc đổi phương thức → lỗi tại ô biến mất;
  - giỏ có 2 × Cappuccino L + Trân châu → màn hiển thị tên món, size, topping, số lượng của dòng đó.
  - Chạy `npm --prefix apps/web test`, ghi lại output đỏ.
- [ ] **P3-2. Lỗi tại ô (AC-F14.5).**
  - Lỗi thẻ lưu ở state riêng, hiển thị trong phần tử có `id` (ví dụ `card-error`) ngay dưới ô; ô dùng `aria-invalid` và `aria-describedby="card-error"`.
  - **Không** thêm `role="alert"` thứ hai: E2E `tests/e2e/checkout.spec.ts:53,86` dùng `getByRole('main').getByRole('alert')`, hai alert cùng lúc làm test đỏ.
  - Xóa lỗi tại ô khi người dùng sửa số thẻ hoặc đổi phương thức.
- [ ] **P3-3. Tóm tắt đơn (UC-04 bước 2).**
  - Chưa có đơn: lặp `shop.cart`, React key là `line.key`.
  - Đã có đơn (thanh toán lại đơn `PAYMENT_FAILED`): lặp `order.items`, React key là `item.id` (item từ server không có `key`).
  - Giữ nguyên dòng "Tổng tiền: …" hiện có, không thêm chuỗi "Tổng tiền" thứ hai.
- [ ] **P3-4. Bỏ 502 (C3).** `CheckoutScreen.tsx:77`: `[402, 502].includes(err.status)` → `err.status === 402`.
- [ ] **P3-5. Kiểm:**
  ```text
  npm --prefix apps/web run lint
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  npm --prefix apps/web run build
  npm --prefix apps/web run test:e2e
  git grep -n "502" -- apps/web/src
  git diff --name-only origin/feat/assignment2-task5-delivery...HEAD
  ```
  Mọi lệnh xanh; `git grep` ra 0 dòng; lệnh cuối chỉ ra allowed paths.
- [ ] **P3-6. Commit và PR.** Commit `feat(web): show order summary and inline card error on checkout`. Mô tả PR ghi: AC đã đạt, mã test mới, output đỏ và xanh. **Không sửa** `docs/traceability-matrix.md`.
