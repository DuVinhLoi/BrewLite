# Kế hoạch: Giao diện minh họa nét mực (hướng 2)

> Phạm vi: chỉ giao diện frontend. Không đổi endpoint, guard, state machine hay luồng đơn hàng.
> Thay cho hướng 1 (nền kem, gọn). Người dùng xem canvas hướng 1, chưa hài lòng, chọn ảnh mẫu ProCoffee (minh họa nét mực), rồi duyệt hướng 2 ngày 2026-10-09.
> Thứ tự làm theo `docs/planning/2026-10-09-frontend-ui-plan.md`. Tài liệu này là đặc tả hình ảnh cho Task 1 (token, component), Task 7a (bộ minh họa) và Task 7 (các màn).
> Canvas (riêng tư, cần Share mới mở được): https://claude.ai/artifact/VVZPLvsyU9tmakKpwJTPgQ, trang "Hướng 2: nét mực".
> - Có 12 artboard: MenuDoodle, KitDoodle, DetailDoodle, CartDoodle, PayDoodle, DoneDoodle, LoginDoodle, ProfileDoodle, HistoryDoodle, StatesDoodle, BaristaDoodle, KhoDoodle.
> - Các artboard có link nối nhau và bấm thử được.
> - Mã nguồn từng artboard nằm ở `docs/superpowers/canvas/project/*.dc.html` của checkout chính. Thư mục này đã nằm trong `.gitignore`. Đây là HTML tĩnh để đọc bố cục và khoảng cách, không chép nguyên vào React.
>
> Đã soát theo `design-taste-frontend`, `redesign-existing-projects`, và `minimalist-ui` (phần màn làm việc).

## 1. Hiện trạng các màn đã được xác nhận

| Màn | Trạng thái | Nguồn kiểm chứng | Việc còn lại |
|---|---|---|---|
| Đăng ký | Đã có đủ backend và frontend | `POST /auth/register` (`backend/src/auth/auth.controller.ts:9`), tab "Đăng ký" ở `/login` | Chỉ làm giao diện |
| Hồ sơ khách | Đã có `GET /users/me` và trang `/profile`, nhưng **lỗi trang trắng khi chưa đăng nhập** | `frontend/src/app/profile/page.tsx:10,25` | Sửa lỗi trước, commit riêng |
| Quản lý kho | Đã có API điều chỉnh tồn và màn `admin` | `backend/src/product/admin-product.controller.ts`, `frontend/src/lib/admin.ts`, `frontend/src/app/admin/page.tsx` | Làm giao diện |

## 2. Đọc ảnh mẫu (taste skill §0)

**Cách đọc:**
- Loại trang: menu đặt cà phê cho khách thật, đồng thời dùng để demo trên lớp.
- Phong cách: theo ảnh mẫu ProCoffee. Minh họa nét mực trên nền trắng, tiêu đề serif đậm và mềm, xoay nghiêng. Chỉ một màu nhấn là cam.
- Cách dựng: CSS và SVG. Không dùng WebGL, không thêm thư viện chuyển động.

Ảnh mẫu là tín hiệu tham chiếu do người dùng đưa (taste §0.A), nên nó được ghi đè các mặc định của skill. Vì vậy hero canh giữa, tiêu đề serif, sao lấp lánh và minh họa vẽ tay đều được phép.

| Vùng | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Hero Menu, khối minh họa ở Login | 7 | 5 | 3 |
| Các màn khách còn lại | 5 | 3 | 4 |
| Barista, Kho | 2 | 1 | 7 |

### 2.1. Ảnh mẫu không phải "AI slop" nhờ đâu, nên giữ gì

1. **Một hệ minh họa nhất quán:** cùng nét mực, cùng độ dày, mảng màu phẳng, hơi lệch như vẽ tay.
2. **Tiêu đề có giọng riêng:** serif đậm, mềm, xoay nhẹ, dòng thứ hai màu cam.
3. **Nền trắng, nhiều khoảng thở:** một màu nhấn, pastel chỉ nằm trong hình vẽ.
4. **Chi tiết UI gọn:** nav dạng viên ở giữa, nút đen có mũi tên ↗.

### 2.2. Phải sửa khi chuyển sang BrewLite (chép nguyên sẽ thành slop)

| Trong ảnh mẫu | Vấn đề | BrewLite làm |
|---|---|---|
| "100% Arabica", "15+ năm", "4.9★" | Số liệu và đánh giá bịa (taste §4.9, §9.D) | Chỉ dùng số thật, liệt kê ngay dưới bảng |
| Avatar khách hàng | Người giả | Ba vòng tròn là ảnh món |
| Nút tim | Không có chức năng, là link chết | Bỏ |
| About us, Contact us | Không có trang | Nav giữ nhãn thật: Menu, Lịch sử, cộng Quầy và Kho theo vai trò |
| Chữ cam nhạt trên nền trắng | Khoảng 2:1, trượt WCAG | Chữ cam từ 24px dùng `#D4721A` (3,4:1). Chữ cam nhỏ dùng `#9A4A0B` (6,2:1). `#F4A340` chỉ làm mảng nền |
| Tiếng Anh | | Tiếng Việt. Line-height tiêu đề từ 1,12 vì có dấu chồng |

Các số thật ở hero:
- "10%": mức giảm của mã BREWLITE10. Backend lấy từ `VOUCHER_RATE`; frontend đang viết thẳng `0.1` trong `PaymentForm.tsx`.
- "+1 điểm cho mỗi 10.000 ₫": backend lấy từ `LOYALTY_RATE` và `VND_PER_POINT`. Frontend chưa có hằng này.
- "4 món, giá từ 35.000 ₫": tính từ `GET /products`.

## 3. Hệ thiết kế

### 3.1. Màu

| Token | Giá trị | Dùng cho | Tương phản trên trắng |
|---|---|---|---|
| `--paper` | `#FFFFFF` | Nền trang, thẻ | |
| `--ink` | `#171513` | Chữ, nét viền, nút chính, mục nav đang chọn | 18,2:1 |
| `--mist` | `#F3F2EF` | Nền nav dạng viên, khối phụ (tổng giỏ, panel Login, khối điểm, cột Quầy) | |
| `--accent` | `#F4A340` | Chỉ làm mảng nền: số trên giỏ, gạch chân vẽ tay, mũi tên trên nút, dải "Mời tới quầy lấy nước", chấm bước hiện tại | Chữ mực trên cam 8,8:1 |
| `--accent-display` | `#D4721A` | Chữ cam từ 24px | 3,4:1, chỉ đạt cho chữ lớn |
| `--accent-ink` | `#9A4A0B` | Giá, liên kết | 6,2:1 |
| `--muted` | `#57514B` | Chữ phụ | 7,8:1 |
| `--line-soft` | `#E6E3DE` | Đường kẻ giữa các dòng bảng Kho | (trang trí) |
| `--ok-bg` / `--ok-ink` | `#E3F0E4` / `#2F5D36` | Còn hàng, Sẵn sàng, Đã thêm ✓, điểm cộng, đăng ký thành công | 6,5:1 |
| `--warn-bg` / `--warn-ink` | `#FCE9D2` / `#9A4A0B` | Sắp hết, Đang pha, cảnh báo 409, phương thức đang chọn | 5,3:1 |
| `--danger-bg` / `--danger-ink` | `#F8E1DC` / `#9B2C1F` | Hết hàng, Đã hủy, lỗi, nút Hủy | 6,0:1 |

Màu chỉ dùng trong minh họa:
- Tím nhạt `#C9C3F5`, tím đậm `#9F97E6`, lá `#A9C9A0`, sữa `#EAD3B6`, hạt `#C48A55`.
- Nền ô từng món: Latte `#F3E7D8`, Americano `#E7E4FA`, Cappuccino `#E4EEDF`, Trà đào `#FCE3D6`.

Quy tắc chung:
- Viền tiêu điểm: `outline: 2.5px solid var(--ink); outline-offset: 3px`.
- Chỉ có chế độ sáng.

### 3.2. Chữ

- **Tiêu đề:** Fraunces 800, `font-variation-settings: 'SOFT' 100, 'WONK' 1, 'opsz' 144`.
  - Theo Google Fonts CSS API (`css2`) ngày 2026-10-09, chỉ Fraunces, Bevan và Alfa Slab One là font serif đậm có subset `vietnamese`.
  - Taste skill cấm lấy Fraunces làm mặc định. Ở đây chọn có lý do: trục SOFT cho nét mềm giống ảnh mẫu, và font có đủ dấu tiếng Việt.
- **Nạp font:** `next/font/google`.
  - Tiêu đề: `Fraunces({ subsets: ['vietnamese', 'latin'], axes: ['SOFT', 'WONK', 'opsz'], display: 'swap', variable: '--font-display' })`. Không khai `weight`; đặt `font-weight: 800` trong CSS.
  - Nội dung: `Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-body' })`.
  - Nếu `next build` không tải được font (mạng hoặc Docker), chuyển sang `next/font/local`, dùng file woff2 giấy phép OFL.
- **Cỡ chữ:**
  - Hero `clamp(46px, 7.4vw, 104px)`, line-height 1.12, cả khối `h1` xoay `-4deg`.
  - Tiêu đề trang `clamp(40px, 5vw, 56px)`. Tiêu đề mục `clamp(40px, 5vw, 60px)`.
  - Tên món 26px (thẻ) hoặc 24px (giỏ). Nội dung 16px, line-height 1.55.
- Giá, tồn kho, điểm, số trên giỏ, giờ đơn dùng `tabular-nums`.

### 3.3. Hình khối

Bo góc:
- CTA lớn: bo 14px, kèm mũi tên ↗ màu cam. Gồm "Đặt cà phê", "Thanh toán", "Xác nhận trả", "Về Menu", "Đăng nhập" ở form.
- Nút trong thẻ, mục nav, pill giỏ hoặc vai trò, chip size/topping, nút ±, nhãn trạng thái: bo tròn đầy.
- Thẻ: 24px. Khối nhấn (panel Login, khối điểm, khối tổng giỏ): 28–32px. Ô màu chứa ảnh món: 16px (ảnh nhỏ 12–14px). Ô nhập: 12px. Modal: 28px.

Viền và bóng:
- Viền mực 2px cho thẻ, ô nhập, nút viền, pill, ô ảnh nhỏ. Viền là "nét" của cả hệ.
- Không dùng bóng mờ. Chỉ có bóng cứng: `6px 6px 0 var(--ink)` khi hover thẻ món, và `8px 8px 0 var(--ink)` cho modal.

Icon:
- Dùng `@phosphor-icons/react` bản `2.1.10`, ghim chính xác, weight `bold`.
- Chỉ dùng icon giỏ (`Handbag` hoặc `ShoppingBag`) và người dùng (`User`).
- Mũi tên ↗ và dấu ✓ giữ là ký tự chữ, giống canvas.
- Component chạy ở server thì import từ `@phosphor-icons/react/dist/ssr`.

## 4. Bộ minh họa (Task 7a)

Nguồn là bản nháp ở `docs/superpowers/canvas/doodles/` của checkout chính (đã nằm trong `.gitignore`).
- Claude vẽ bằng tọa độ SVG, đã chụp bằng Chrome headless để kiểm.
- Mỗi file dưới 1,5 KB, không có `<style>`, animation hay chữ.

| File | Dùng ở | Đích trong repo |
|---|---|---|
| `moka.svg` | Tâm hero Menu; góc khối "Đơn của bạn" ở Thanh toán | `frontend/public/doodles/` |
| `mug.svg` | Hero; khối tổng giỏ; giỏ trống; lỗi tải menu; Đặt hàng thành công; Login; Hồ sơ; cột Quầy rỗng | `frontend/public/doodles/` |
| `bag.svg` | Hero (cột trái); menu rỗng; lịch sử rỗng; tiêu đề Lịch sử | `frontend/public/doodles/` |
| `bean.svg` | Logo; hero; khối điểm; trạng thái chưa đăng nhập | `frontend/public/doodles/` |
| `leaf.svg` | Hero (hai bên); Login; Thanh toán | `frontend/public/doodles/` |
| `sparkle.svg`, `burst.svg` | Hero; cạnh tiêu đề; Đặt hàng thành công; cảnh báo Kho | `frontend/public/doodles/` |
| `latte.svg`, `americano.svg`, `cappuccino.svg`, `tra-dao.svg` | Ảnh món | **Ghi đè** `frontend/public/images/` cùng tên |

Ảnh món:
- Ghi đè đúng tên cũ (`/images/latte.svg`, ...), nên `seed.ts` và DB không phải đổi.
- Khi ghi đè, đổi `viewBox` thành `0 0 240 180` (tỉ lệ 4:3), thêm `rect` nền màu ô của món (bo 20) làm lớp dưới cùng, và đặt hình ly vào giữa.
- Nhờ vậy frontend không cần bảng ánh xạ màu theo món. Ô màu chỉ cần `background` trùng màu nền trong file, hoặc để trong suốt.

Quy tắc cho mọi hình:
- Nét `#171513` dày 3px (bình moka 3,5px), đầu và góc tròn.
- Màu nền chỉ lấy từ bảng màu minh họa.
- Không gradient, không chữ trong hình.
- Hình trang trí đặt `alt=""` và `aria-hidden`. Ảnh món có `alt` là tên món.

## 5. Chuyển động

| Phần tử | Chuyển động | Lý do |
|---|---|---|
| Hơi nước từ vòi bình, mũi tên cong ở hero | Vẽ nét một lần khi tải (`stroke-dashoffset`, 1,8s và 1,4s, trễ 0,3s và 1s) | Kể chuyện: cà phê vừa pha. Mũi tên dẫn mắt vào bình |
| Bình moka (hero), cốc (panel Login) | Nổi lên xuống 8–10px, chu kỳ 6s | Cảm giác "bay bổng". Mỗi màn chỉ một vật lặp |
| 4 ngôi sao ở hero | Nhấp nháy lệch pha (scale 0,68 ↔ 1, chu kỳ 3,2s) | Điểm sáng quanh hình chính |
| Cành lá ở hero | Lắc 4°, chu kỳ 5s | Nhẹ, nằm ở rìa |
| Sao ở Đặt hàng thành công | Bật lên một lần (scale 0,4 → 1,15 → 1, 0,6s, lệch 0,15s) | Phản hồi: đặt xong |
| Skeleton | Mờ đậm (opacity 1 ↔ 0,55, chu kỳ 1,4s) | Báo đang tải |
| Thẻ món | Hover: nhấc 3px, xoay -1°, hiện bóng cứng | Phản hồi thao tác |
| Mọi nút | `:active` scale 0,98 | Phản hồi khi bấm |

Quy tắc:
- Mọi chuyển động nằm trong `@media (prefers-reduced-motion: no-preference)`. Khi giảm chuyển động thì trang đứng yên và nét vẽ hiện đủ.
- Chỉ animate `transform`, `opacity`, `stroke-dashoffset`. Dùng CSS thuần.
- Barista và Kho không có chuyển động.

## 6. Từng màn (đối chiếu artboard)

1. **Header, mọi màn** (artboard nào cũng có)
   - Trái: logo gồm `bean.svg` xoay -24° và chữ "BrewLite" Fraunces 28px.
   - Giữa: nav dạng viên trên nền `--mist`. Mục đang chọn nền mực, chữ trắng, có `aria-current="page"`.
     - Khách: Menu, Lịch sử.
     - BARISTA: thêm Quầy. ADMIN: thêm Quầy và Kho.
   - Phải:
     - Pill "Xem giỏ hàng", **giữ đúng nhãn hiện có**, kèm số trên nền cam.
     - Pill vai trò gồm icon người và nhãn `ROLE_LABEL` (Khách, Quầy, Quản trị). Email đặt ở `title`, link tới `/profile`. Giữ nhãn vai trò là để demo nhiều tab vẫn nhìn ra tab nào là ai.
     - Nút chữ "Đăng xuất". Khi chưa đăng nhập, thay bằng pill "Đăng nhập".
   - Dưới 760px các nhóm xuống dòng. Ở 1024px nav không vỡ thành 2 dòng.
2. **Menu, phần hero** (artboard MenuDoodle)
   - Tiêu đề "Cà phê mỗi ngày / pha đúng vị", xoay -4°, dòng 2 màu `--accent-display`.
   - Bên dưới là lưới 3 cột:
     - Trái: `bag.svg`; 2 số thật "10%" (giảm với mã BREWLITE10) và "+1" (điểm cho mỗi 10.000 ₫).
     - Giữa: cảnh bình moka gồm hơi nước, mũi tên, cốc, 2 hạt, 2 cành lá, 4 sao, chấm.
     - Phải:
       - Câu mô tả "Chọn món, thanh toán không tiền mặt, nhận ly khi quầy báo sẵn sàng."
       - CTA "Đặt cà phê ↗", cuộn tới `#menu`.
       - Cụm 3 vòng ảnh món.
       - "N món / giá từ X": N và X tính từ dữ liệu menu; khi đang tải hoặc lỗi thì ẩn.
   - Dưới 760px: một cột; ẩn túi, mũi tên và lá trái; khung hình cao 380px. Hero đặt `overflow-x: clip`.
3. **Menu, phần lưới món** (MenuDoodle)
   - Đầu lưới: "Menu hôm nay", gạch chân cam vẽ tay, dòng nhắc mã BREWLITE10.
   - Lưới `repeat(auto-fill, minmax(250px, 1fr))`. Thẻ viền mực 2px, ô 4:3.
   - Trong thẻ: tên món 26px; giá màu `--accent-ink`; "Còn N" hoặc "Sắp hết, còn N" (khi ≤ `LOW_STOCK`) hoặc nhãn "Hết hàng".
   - Nút:
     - "Thêm vào giỏ" dạng viên mực.
     - Sau khi thêm hiện "Đã thêm ✓", nền `--ok-bg`, `aria-live`.
     - "Tùy chọn size / topping" là liên kết mở modal.
     - Hết hàng: ảnh mờ và xám, cả hai nút vô hiệu.
4. **Chi tiết món** (DetailDoodle)
   - Modal 2 cột: ô màu với ảnh lớn bên trái, nội dung bên phải.
   - Nội dung:
     - Tiêu đề 42px.
     - Dòng "Giá gốc: … • Còn N", giữ chữ hiện có.
     - Size và topping là chip viên viền mực, có `aria-pressed`, ghi phụ phí (S +0 ₫, M +5.000 ₫, L +10.000 ₫; Trân châu +5.000 ₫, Kem cheese +8.000 ₫, Thạch cà phê +6.000 ₫, đều từ `pricing.ts`).
     - Số lượng dùng nút tròn −/+.
     - "Tạm tính" bằng Fraunces.
   - Nút: "Đóng" (viền) và "Thêm vào giỏ • …" (mực). Giữ focus trap và đóng bằng Esc theo kế hoạch chung.
5. **Giỏ hàng** (CartDoodle)
   - Tiêu đề "Giỏ hàng (n món)", giữ chữ hiện có.
   - Hai cột:
     - Trái: danh sách thẻ. Mỗi thẻ có ô ảnh 104px, tên, dòng "Size M • …", "… / ly", nút −/+ tròn, nút chữ "Xóa", thành tiền.
     - Phải: khối `--mist` gồm "Tổng" (Fraunces 48px), câu "Mã giảm giá nhập ở bước thanh toán.", CTA "Thanh toán • … ↗", và nút viền "Xóa hết".
   - Giỏ trống: cốc, "Giỏ hàng trống", "Hãy chọn vài món ngon từ menu nhé!", CTA "Về Menu ↗".
6. **Thanh toán** (PayDoodle)
   - Hai cột: thẻ form bên trái, khối "Đơn của bạn" (danh sách món, hình moka) bên phải.
   - Form:
     - "Tổng: …".
     - Ô "Mã giảm giá" có nhãn ở trên, nút "Áp dụng", gợi ý "Ví dụ: BREWLITE10".
     - Kết quả mã: thành công nền ok ("Đã áp …: −…"); sai mã nền danger ("Mã … không hợp lệ, tính giá gốc"). Giữ chữ hiện có.
     - "Thực trả" bằng Fraunces 44px, có gạch đứt mực phía trên.
     - "Phương thức" là `fieldset` với 2 thẻ `input type="radio"` thật (Ví điện tử, Thẻ ngân hàng). Bỏ cách giả radio bằng chữ "(o)" và "( )".
     - Dòng "Không dùng tiền mặt".
     - Nút "← Quay lại giỏ" (viền) và CTA "Xác nhận trả • … ↗".
7. **Đặt hàng thành công** (DoneDoodle)
   - Phần đầu: cốc với 3 sao bật lên, tiêu đề "Đặt hàng thành công".
   - Thẻ biên lai:
     - "Mã đơn: #xxxxxxxx" (Fraunces).
     - Nhãn "+N điểm tích lũy" nền ok, theo Task 5.
     - "Trạng thái:" kèm thanh 5 bước.
     - "Đã trả: … (phương thức)".
     - Dải cam "Mời tới quầy lấy nước".
   - Nút viền "Về trang chủ".
   - **Thanh trạng thái giữ đúng cấu trúc mà `OrderStatusTrack.test.ts` đang kiểm:** nhãn bước đã qua có tiền tố "✓ ", đúng một phần tử có `aria-current="step"`. PAYMENT_FAILED và CANCELLED vẫn hiện nhãn riêng thay cho thanh tiến trình.
   - Chấm bước: đã qua nền mực, bước hiện tại nền cam, bước sau nền trắng. Nối bằng nét liền (đã qua) hoặc nét đứt (chưa tới).
8. **Đăng nhập / Đăng ký** (LoginDoodle)
   - Hai cột:
     - Trái: panel `--mist` bo 32, tiêu đề "Đăng nhập để đặt món và theo dõi đơn" xoay -2°, câu về điểm, cốc nổi, lá, hạt, sao.
     - Phải: form viền mực bo 28.
   - Form:
     - Tab dạng viên có `aria-pressed`.
     - Thông báo `role="status"` "Đăng ký thành công. Đăng nhập bằng email vừa tạo." Đây là chữ mới: sửa sơ đồ UC03 trong cùng commit.
     - Nhãn đặt trên ô nhập. "Ít nhất 6 ký tự." dưới ô mật khẩu.
     - Nút mực bo 14.
9. **Hồ sơ** (ProfileDoodle)
   - Khối `--mist`: "Điểm tích lũy", số điểm Fraunces 150px màu `--accent-display` xoay -3°, chữ "điểm", hạt cà phê rải.
   - Thẻ bên phải: Email, Vai trò (nhãn), cốc, nút viền "Xem lịch sử đơn hàng ↗".
10. **Lịch sử** (HistoryDoodle)
    - Danh sách thẻ, rộng tối đa 860px.
    - Mỗi thẻ:
      - Mã đơn (Fraunces), nhãn trạng thái theo `STATUS_LABEL`, tổng tiền.
      - Thời gian; thanh 5 bước cỡ nhỏ.
      - Dòng món có ô ảnh 44px, chữ "1× Tên món (M + topping)" (tên món lấy từ `productName` của Task 3) và đơn giá.
      - Nút viền đỏ "Hủy đơn" khi `canCancel`.
    - Đơn đã hủy hoặc thanh toán lỗi: mờ 0,72, không có thanh tiến trình.
    - Bỏ dòng hiện tại "#id • STATUS • total" có mã trạng thái tiếng Anh, và bỏ em-dash trong dòng món.
11. **Trạng thái** (StatesDoodle)
    - Menu đang tải: 4 skeleton cùng hình thẻ.
    - Menu lỗi: cốc nghiêng, "Không tải được menu.", lỗi chi tiết, nút "Thử lại".
    - Menu rỗng: túi hạt, "Chưa có món nào."
    - Giỏ trống (như mục 5).
    - Lịch sử rỗng: túi hạt, "Chưa có đơn hàng nào.", CTA "Xem menu ↗".
    - Chưa đăng nhập (dùng cho Hồ sơ và Lịch sử): hạt, "Bạn chưa đăng nhập.", CTA "Đăng nhập".
12. **Quầy pha chế** (BaristaDoodle)
    - Tiêu đề Fraunces và dòng "Tự tải lại mỗi 5 giây." (`POLL_MS`).
    - 3 cột nền `--mist` theo `QUEUE_COLUMNS`:
      - Chờ pha (số đếm nền mực).
      - Đang pha (nền warn).
      - Sẵn sàng (nền ok).
    - Thẻ đơn: viền mực, mã đơn, tổng, giờ, danh sách món.
    - Nút mực theo `ACTION_LABEL` (Nhận pha, Pha xong, Đã giao). Cột Chờ pha có thêm nút viền đỏ "Hủy (hết nguyên liệu)".
    - Cột rỗng: cốc mờ và "Không có đơn". Không có chuyển động.
13. **Kho** (KhoDoodle, route `/admin`)
    - Tiêu đề Fraunces; dòng tóm tắt tính từ `stockBadge`.
    - Cảnh báo 409 viền và nền warn, giữ chữ trong `lib/admin.ts`.
    - Bảng trong khung viền mực bo 24, có `overflow-x: auto`.
    - Các cột:
      - Món (ô ảnh 48px).
      - Giá.
      - Tồn kho: số 24px đậm kèm nhãn.
      - Điều chỉnh nhanh: chip −1 / +1 / +10 có `aria-label`.
      - Đặt số: ô nhập có `<label>` ẩn, nút "Lưu" vô hiệu khi giá trị sai.

## 7. Các bước

Phiên làm việc ở worktree theo file yêu cầu `docs/superpowers/requests/2026-10-09-ke-hoach-worktree-ui.md` (ở checkout chính). Thứ tự task và checkpoint lấy từ `frontend-ui-plan.md`.
- Task 1 làm theo mục 3.
- Task 7a làm theo mục 4, chen vào trước Task 7.
- Task 7 làm theo mục 6.

Kiểm chứng cuối (phần soát cuối của taste skill, rút gọn):
- Không có em-dash trong chữ hiển thị.
- Mỗi con số ở hero truy được về hằng số hoặc endpoint.
- Tương phản đúng như bảng 3.1.
- Giảm chuyển động thì trang đứng yên hoàn toàn.
- Ở 360px không cuộn ngang.
- Dấu tiếng Việt không bị cắt ở tiêu đề xoay.
- `next build` tải được font.
- Không có link chết.
- Test hiện có vẫn xanh.

## 8. Quyết định đã chốt (2026-10-09)

1. Font tiêu đề: **Fraunces**.
2. Câu tiêu đề hero: **"Cà phê mỗi ngày / pha đúng vị"**. Ý "không tiền mặt" nằm ở câu mô tả bên phải.
3. Nguồn minh họa: **bộ SVG Claude vẽ** (mục 4).
4. Icon chức năng: **`@phosphor-icons/react` bản `2.1.10`**, chỉ dùng giỏ và người dùng.
5. Chiều cao hero: **như ảnh mẫu** (khoảng 760px). "Đặt cà phê ↗" cuộn xuống lưới món.
6. Không làm WebGL (ThreeUI để backlog). Kho giữ ở `/admin`. Chế độ tối nằm ngoài phạm vi.

## 9. Ràng buộc

- Theo `.claude/rules/doc-code-sync.md`: nếu đổi chữ nút, nhãn trạng thái hoặc thông báo lỗi mà sơ đồ sequence trích, sửa sơ đồ trong cùng commit.
  - Chữ giữ nguyên: "Đã thêm ✓", "Giỏ hàng (n món)", "Xem giỏ hàng", "Thanh toán • …", "Xác nhận trả • …", "← Quay lại giỏ", "Mời tới quầy lấy nước", "Về trang chủ", nhãn `STATUS_LABEL`, `ACTION_LABEL`, `QUEUE_COLUMNS`.
  - Chữ mới, phải kiểm sơ đồ: thông báo đăng ký thành công, các câu trạng thái rỗng và lỗi mới, câu mô tả ở hero.
- Không đổi route, nhãn nav, tên trường form, endpoint, guard, state machine.
- Phụ thuộc mới duy nhất là `@phosphor-icons/react@2.1.10` (ghim chính xác).
- Test hiện có phải tiếp tục xanh. Không thêm trailer đồng tác giả vào commit.
