# Card Task 5 – Người 2: xác nhận xóa, thành tiền từng dòng, PWA manifest

> Chỉ mục: [`README.md`](README.md). Thuộc Task 5, Pha B. Chỉ bắt đầu khi chủ Task 5 báo Pha A xong (CR-task5 mục CR-5.0).
>
> Người làm tự viết code và test, giải thích được từng dòng khi vấn đáp.

**Branch:** `a2/task5-p2-cart-pwa`, tạo từ `origin/feat/assignment2-task5-delivery` **sau Pha A**. PR mở vào `feat/assignment2-task5-delivery`, không vào `develop-Assignment2`.

**Allowed paths:**
- `apps/web/src/components/shop/CartScreen.tsx`
- `apps/web/src/components/shop/CartScreen.test.tsx` (tạo mới)
- `apps/web/src/app/manifest.ts` (tạo mới)
- `apps/web/public/icons/` (tạo mới: `icon-192.png`, `icon-512.png`)
- `apps/web/src/app/layout.tsx` (chỉ khi cần thêm `viewport.themeColor`)

## Yêu cầu (SRS trên `develop-Assignment2`)

- **AC-F06.2:** bấm "−" ở số lượng 1 thì dòng chỉ bị xóa **sau khi khách xác nhận**; số lượng lớn hơn 1 thì giảm 1.
- **AC-F06.3:** nút "Xóa" xóa ngay một dòng, không hỏi lại.
- **AC-F07.1:** mỗi dòng hiển thị đơn giá và thành tiền (2 × Cappuccino L + Trân châu → đơn giá `62.000đ`, thành tiền `124.000đ`).
- **AC-N10.1 (NFR-10, Must):** web app manifest có `name`, `short_name`, `start_url`, `display = standalone`, `theme_color`, biểu tượng 192 px và 512 px; trang có `<link rel="manifest">`.

## Hiện trạng

- `CartScreen.tsx:9`: nút "−" gọi `quantity(line.key, line.quantity - 1)`, về 0 là xóa luôn; mỗi dòng chỉ có đơn giá.
- `apps/web/public` chỉ có `images/`; không có manifest.

## Các bước

- [ ] **P2-1. Test đỏ trước** trong `CartScreen.test.tsx` (mẫu: `MenuScreen.test.tsx`):
  - `vi.spyOn(window, 'confirm').mockReturnValue(false)` rồi bấm "−" ở số lượng 1 → `quantity` không được gọi với 0;
  - `mockReturnValue(true)` → `quantity(key, 0)` được gọi;
  - số lượng 2 → bấm "−" không gọi `confirm`;
  - dòng 2 × 62.000đ hiển thị "Thành tiền: 124.000đ".
  - Chạy `npm --prefix apps/web test`, ghi lại output đỏ.
- [ ] **P2-2. `CartScreen.tsx`.**
  - "−" ở số lượng 1: hỏi `window.confirm(...)` trước khi gọi `quantity(key, 0)` (cùng cách `OrdersScreen.tsx:30` hỏi khi hủy đơn). Nút "Xóa" giữ nguyên, không hỏi.
  - Nhãn thành tiền là **"Thành tiền: …"**. Không dùng chữ "Tổng tiền" trong dòng: E2E `tests/e2e/checkout.spec.ts:18,20,29` tìm `'Tổng tiền: 124.000đ'` theo chuỗi con.
  - Playwright tự đóng hộp thoại (tương đương bấm hủy). Hiện chưa E2E nào bấm "−"; nếu thêm E2E bấm "−" ở số lượng 1 thì phải xử lý `page.on('dialog')`.
- [ ] **P2-3. Manifest.** Tạo `apps/web/src/app/manifest.ts` (Next.js tự chèn `<link rel="manifest">`) với đủ trường AC-N10.1; `start_url: '/'`, `display: 'standalone'`; icon trỏ `/icons/icon-192.png`, `/icons/icon-512.png` (PNG đúng kích thước).
- [ ] **P2-4. Kiểm:**
  ```text
  npm --prefix apps/web run lint
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  npm --prefix apps/web run build
  npm --prefix apps/web run test:e2e
  git diff --name-only origin/feat/assignment2-task5-delivery...HEAD
  ```
  Thêm: chạy web, mở `/manifest.webmanifest` thấy đủ trường; xem mã nguồn trang `/` có `<link rel="manifest"`. Ghi cả hai vào mô tả PR.
- [ ] **P2-5. Commit và PR.** Commit `feat(web): confirm cart line removal, show line totals, add web manifest`. Mô tả PR ghi: AC đã đạt, mã test mới, output đỏ và xanh. **Không sửa** `docs/traceability-matrix.md`.
