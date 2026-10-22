# Card Task 5 – Người 1: số lượng và giới hạn tồn kho ở trang chi tiết

> Chỉ mục: [`README.md`](README.md). Thuộc Task 5, Pha B. Chỉ bắt đầu khi chủ Task 5 báo Pha A xong (CR-task5 mục CR-5.0).
>
> Người làm tự viết code và test, giải thích được từng dòng khi vấn đáp.

**Branch:** `a2/task5-p1-quantity`, tạo từ `origin/feat/assignment2-task5-delivery` **sau Pha A**. PR mở vào `feat/assignment2-task5-delivery`, không vào `develop-Assignment2`.

**Allowed paths:**
- `apps/web/src/components/shop/ProductDetail.tsx`
- `apps/web/src/components/shop/ProductDetail.test.tsx` (tạo mới)
- `apps/web/src/lib/shop.ts`, `apps/web/src/lib/shop.test.ts`

## Yêu cầu (SRS trên `develop-Assignment2`)

- **AC-F05.1:** chọn được số lượng trước khi bấm "Thêm vào giỏ" (ví dụ Cappuccino L + Trân châu, số lượng 2 → giỏ có một dòng số lượng 2).
- **AC-F05.4:** `stock = 0` thì không thêm được; khi số lượng đã có trong giỏ bằng `stock` thì nút thêm bị vô hiệu kèm thông báo đúng nguyên văn **"Đã đạt số lượng tối đa còn lại"**.
- **AC-F05.5:** giỏ đã có 20 dòng thì thêm dòng thứ 21 bị từ chối với thông báo đúng nguyên văn **"Giỏ hàng tối đa 20 món"**.

## Hiện trạng

- `ProductDetail.tsx:25` luôn gửi `quantity: 1`; `:28` chỉ khóa nút khi `stock <= 0`.
- `shop.ts:12` ném lỗi khi một dòng vượt 99; `shop.ts:13` ghi "Giỏ hàng tối đa 20 dòng".

## Các bước

- [ ] **P1-1. Test đỏ trước.**
  - `shop.test.ts`: đổi kỳ vọng dòng 19 sang `toThrow('Giỏ hàng tối đa 20 món')`.
  - `ProductDetail.test.tsx` (mẫu viết test: `apps/web/src/components/menu/MenuScreen.test.tsx`; bọc component bằng `ShopProvider` hoặc mock `useShop`): chọn số lượng 2 rồi thêm → `add` nhận `quantity: 2`; giỏ đã có đủ `stock` của sản phẩm → nút "Thêm vào giỏ" bị vô hiệu và hiện "Đã đạt số lượng tối đa còn lại".
  - Chạy `npm --prefix apps/web test`, ghi lại output đỏ vào report.
- [ ] **P1-2. Sửa `shop.ts:13`** thành "Giỏ hàng tối đa 20 món".
- [ ] **P1-3. Ô chọn số lượng ở `ProductDetail.tsx`.**
  - Còn lại được thêm = `min(stock − tổng quantity của mọi dòng cùng productId trong giỏ, 99 − quantity của dòng cùng key)`. Lý do: `addLine` (`shop.ts:12`) ném lỗi khi một dòng vượt 99.
  - Số lượng chọn từ 1 đến "còn lại"; "còn lại" bằng 0 thì vô hiệu nút và hiện thông báo AC-F05.4.
  - Không hiển thị thêm một chuỗi `62.000đ` nữa (ví dụ thành tiền khi số lượng là 1): E2E `tests/e2e/checkout.spec.ts:14` dùng `getByText('62.000đ', { exact: true })`, hai chuỗi trùng sẽ làm test đỏ.
- [ ] **P1-4. Kiểm:**
  ```text
  npm --prefix apps/web run lint
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  npm --prefix apps/web run build
  npm --prefix apps/web run test:e2e
  git diff --name-only origin/feat/assignment2-task5-delivery...HEAD
  ```
  Mọi lệnh xanh; lệnh cuối chỉ ra allowed paths. E2E cần API và DB chạy local theo `README.md` gốc.
- [ ] **P1-5. Commit và PR.** Commit `feat(web): add quantity picker and stock cap on product detail`. Mô tả PR ghi: AC đã đạt, mã test mới (để chủ Task 5 chép vào ma trận), output đỏ ở P1-1 và output xanh ở P1-4. **Không sửa** `docs/traceability-matrix.md`.
