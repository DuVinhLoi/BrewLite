# Đối chiếu 5 màn với wireframe đề §7 (Task 9)

Ngày 2026-10-11, nhánh `worktree-ui-plan-checkpoint`.

- Wireframe: `docs/BrewLite-CongNghePhanMem-fixed.md` mục 7 ("Giao diện MVP tham khảo", 5 màn). Đề gọi chúng là *tham khảo*, nên khi khác nhau thì đặc tả hình ảnh `docs/planning/2026-10-09-ui-visual-plan.md` (viết tắt VP) thắng. Mã nguồn artboard (`PayDoodle`, `DetailDoodle`, ...) nằm ở checkout chính, `docs/superpowers/canvas/project/*.dc.html`.
- Cách làm: đọc JSX, CSS Module và test của từng màn, đối chiếu từng phần tử của wireframe (thứ tự, nút, nhãn, chữ cố định). **Chưa xem trên trình duyệt**; kết luận về thứ tự dựa vào thứ tự phần tử trong JSX và vào artboard.
- Verdict chỉ có ba giá trị: **khớp**, **lệch có chủ đích** (kèm lý do và nguồn), **lệch không chủ đích** (sửa trong task này, ghi commit).
- Kết quả: **không có chỗ lệch không chủ đích**, nên không sửa code. Mọi chỗ lệch đều nằm trong VP, ruling trước đó hoặc kế hoạch task, trừ tên món "Latte" (dữ liệu seed backend, chưa ai quyết; xem "Câu hỏi mở" cuối file).

Đường dẫn code tính từ `frontend/src/`.

## Màn 1: Menu

| Wireframe nói | Màn hiện tại làm (file:dòng) | Verdict |
|---|---|---|
| Đầu màn: "BrewLite ≡" | Logo `bean.svg` + chữ "BrewLite" (`components/HeaderView.tsx:22-23`) và nav dạng viên (`HeaderView.tsx:26`) thay cho nút ≡. Dưới 760px các nhóm xuống dòng | lệch có chủ đích: VP §6 mục 1 (header ở mọi màn, nav viên). VP không nhắc nút ≡; việc không còn menu ẩn là suy luận của người làm, không phải câu của VP |
| 4 dòng món, mỗi dòng "tên + giá" ("Cà phê sữa 35k") | Lưới thẻ: ảnh, tên (`components/ProductCard.tsx:56`), rồi giá `formatVND` "35.000 ₫" (`ProductCard.tsx:58`). Thứ tự tên rồi giá giữ nguyên | khớp về thứ tự và nội dung. Cách ghi giá "35k" là cách viết tắt của hình; `formatVND` là nguồn duy nhất cho mọi số tiền (`lib/pricing.ts`) |
| Tên món "Cà phê sữa" | Tên lấy từ `GET /products`; seed backend đặt "Latte" (`backend/prisma/seed.ts:31`). Menu mẫu khi chưa có API vẫn là "Cà phê sữa" (`lib/mock-products.ts:7`) | lệch có chủ đích. Lý do: tên món là dữ liệu của backend (`backend/prisma/seed.ts:31` đặt `name: 'Latte'`, có từ trước khi làm giao diện), không phải bố cục. Nguồn khác gọi món này là "Latte": `docs/planning/2026-10-09-ui-visual-plan.md:79` (§3.1, màu ô món) và các artboard canvas (MenuDoodle, CartDoodle, PayDoodle...). Chỉ menu mẫu `lib/mock-products.ts:7` còn theo wireframe. Chưa có ruling nào chốt tên món; đổi tên trong seed (đụng backend, DB đã seed, test và tài liệu) chưa làm trong task này, xem "Câu hỏi mở" cuối file |
| Cuối màn: nút "Xem giỏ hàng (0)" | Pill "Xem giỏ hàng" kèm số trên nền cam, nằm ở header, mọi màn đều có (`HeaderView.tsx:43-49`). Nhãn giữ nguyên, số hiện thành huy hiệu thay vì dấu ngoặc | lệch có chủ đích: VP §6 mục 1 ("giữ đúng nhãn hiện có, kèm số trên nền cam") và VP §9 (chữ giữ nguyên "Xem giỏ hàng"). Test `components/HeaderView.test.ts:80` |
| (không có) | Hero trên đầu lưới (`app/page.tsx:21`, `components/menu/MenuHero.tsx`), tiêu đề "Menu hôm nay", nút "Thêm vào giỏ" và liên kết "Tùy chọn size / topping" trong thẻ (`ProductCard.tsx:72`, `ProductCard.tsx:84`) | lệch có chủ đích: VP §6 mục 2 và 3 (artboard MenuDoodle). Phần thêm, không bỏ phần tử nào của wireframe |

## Màn 2: Chi tiết món

| Wireframe nói | Màn hiện tại làm (file:dòng) | Verdict |
|---|---|---|
| Đầu màn: "← Cappuccino" (nút lùi + tên món) như một trang riêng | Hộp thoại có `role="dialog"` (`components/ProductDetailModal.tsx:87`), tiêu đề tên món `h2` (`ProductDetailModal.tsx:108`), không có mũi tên; đóng bằng nút "Đóng" (`ProductDetailModal.tsx:182`) hoặc Esc (bắt ở `document`, `ProductDetailModal.tsx:40`, hàm `isCloseEscape` của `lib/focus-trap`) | lệch có chủ đích: VP §6 mục 4 (modal 2 cột, nút "Đóng") và quyết định Q4 ngày 2026-10-09, ghi ở `docs/user-sequence-specifications.md` §2.1 mục C (modal tính là "màn hình chi tiết", wireframe chỉ tham khảo) |
| "Giá: 45.000đ" | "Giá gốc: 45.000 ₫ • Còn N" ngay dưới tên, trước Size (`ProductDetailModal.tsx:111`) | lệch có chủ đích: VP §6 mục 4 ("giữ chữ hiện có"). Vị trí khớp (giá ngay sau đầu màn, trước Size) |
| "Size: S · M · L" | Nhãn "Size", 3 chip S, M, L kèm phụ phí (`ProductDetailModal.tsx:117`, `:122`) | khớp (đủ 3 size; phụ phí là phần thêm theo VP §6 mục 4) |
| "Topping: Trân châu / Kem" | Nhãn "Topping", chip theo `TOPPING_PRICES`: Trân châu, Kem cheese, Thạch cà phê (`ProductDetailModal.tsx:130`, `:141`; `lib/pricing.ts:18-20`) | lệch có chủ đích: danh sách và tên topping lấy từ `lib/pricing.ts` (nguồn duy nhất, trùng bản sao backend `backend/src/order/pricing.ts`); wireframe chỉ nêu ví dụ |
| Thứ tự: Giá, Size, Topping, nút "Thêm vào giỏ" | Giá, Size, Topping, Số lượng + Tạm tính, rồi "Đóng" và "Thêm vào giỏ • …" (`ProductDetailModal.tsx:111`, `:117`, `:130`, `:150`, `:170`, `:182`, `:185`) | khớp về thứ tự. "Số lượng" và "Tạm tính" là phần thêm (VP §6 mục 4) |
| Nút "Thêm vào giỏ" | "Thêm vào giỏ • <thành tiền>" (`ProductDetailModal.tsx:185`) | lệch có chủ đích: VP §6 mục 4 (nút mực "Thêm vào giỏ • …"); chữ "Thêm vào giỏ" giữ đầu nhãn |

## Màn 3: Giỏ hàng

| Wireframe nói | Màn hiện tại làm (file:dòng) | Verdict |
|---|---|---|
| Tiêu đề "Giỏ hàng" | "Giỏ hàng (n món)" (`components/cart/CartView.tsx:48`) | lệch có chủ đích: VP §6 mục 5 và §9 ("Giỏ hàng (n món)" giữ chữ hiện có). Chữ "Giỏ hàng" vẫn đứng đầu |
| Dòng "Cappuccino M x1", "Trà đào L x2" (tên, size, số lượng trên một dòng) | Mỗi dòng là thẻ: ảnh 104px, tên `h2` (`CartView.tsx:67`), "Size M • topping" (`CartView.tsx:69`), "… / ly", nút −/+ tròn có số lượng (`CartView.tsx:75`), "Xóa", thành tiền | lệch có chủ đích: VP §6 mục 5 (artboard CartDoodle). Đủ ba dữ kiện tên, size, số lượng, ở các phần tử riêng |
| "Tổng: 123.000đ" | Nhãn "Tổng" (`CartView.tsx:84`) và số tiền Fraunces 48px ngay dưới (`CartView.tsx:85`), không có dấu hai chấm | lệch có chủ đích: VP §6 mục 5 ("Tổng" Fraunces 48px), artboard CartDoodle dòng 80 |
| Nút "Thanh toán" | "Thanh toán • <tổng> ↗" (`CartView.tsx:88`) | lệch có chủ đích: VP §9 (chữ "Thanh toán • …" giữ nguyên); chữ "Thanh toán" vẫn đứng đầu nhãn |
| Thứ tự: tiêu đề, các dòng, Tổng, nút Thanh toán | Tiêu đề, danh sách thẻ, khối tổng (Tổng, câu nhắc mã giảm giá, "Thanh toán •", "Xóa hết") (`CartView.tsx:48`, `:67`, `:84`, `:88`, `:91`). Ở màn rộng khối tổng nằm cột phải | khớp về thứ tự. "Xóa hết" và câu nhắc mã giảm giá là phần thêm (VP §6 mục 5) |

## Màn 4: Thanh toán

| Wireframe nói | Màn hiện tại làm (file:dòng) | Verdict |
|---|---|---|
| Tiêu đề "Thanh toán" | `h1` "Thanh toán" (`components/PaymentForm.tsx:138`) | khớp |
| "Tổng: 123.000đ" | "Tổng: <tổng>" ngay đầu thẻ form (`PaymentForm.tsx:144`) | khớp |
| Khối "Phương thức" có "(o) Ví điện tử" và "( ) Thẻ ngân hàng" | `fieldset` + `legend` "Phương thức" + 2 `input type="radio"` thật: Ví điện tử, Thẻ ngân hàng (`PaymentForm.tsx:188`, `:192`) | lệch có chủ đích: VP §6 mục 6 ("bỏ cách giả radio bằng chữ (o) và ( )"). Hai lựa chọn và nhãn giữ nguyên |
| "Mã giảm giá (BREWLITE10)" nằm *sau* hai lựa chọn phương thức, trong cùng khối | Ô "Mã giảm giá" có nhãn, nút "Áp dụng", gợi ý "Ví dụ: BREWLITE10" (`PaymentForm.tsx:149`, `:167`) nằm *trước* khối "Phương thức" (`PaymentForm.tsx:188`), sau đó có "Thực trả" (`PaymentForm.tsx:183`) | lệch có chủ đích: VP §6 mục 6 liệt kê Tổng, Mã giảm giá, Thực trả, rồi Phương thức; artboard PayDoodle dựng cùng thứ tự (`PayDoodle.dc.html` dòng 50, 53, 68, 73, 80). Cần mã giảm giá trước để "Thực trả" hiện đúng trước khi chọn phương thức |
| "Không dùng tiền mặt" nằm sau khối phương thức, trước nút | Dòng "Không dùng tiền mặt" là phần tử cuối trong `fieldset` Phương thức, ngay trước hàng nút (`PaymentForm.tsx:203`) | khớp |
| Nút "Xác nhận trả" | "Xác nhận trả • <thực trả>" (`PaymentForm.tsx:217`) | lệch có chủ đích: VP §6 mục 6 và §9 (chữ "Xác nhận trả • …" giữ nguyên); chữ "Xác nhận trả" vẫn đứng đầu nhãn |
| (không có) | Nút "← Quay lại giỏ" và khối "Đơn của bạn" (`PaymentForm.tsx:214`, `:227`) | lệch có chủ đích: VP §6 mục 6. Phần thêm, không bỏ phần tử nào của wireframe |

## Màn 5: Xác nhận / Đặt hàng thành công

| Wireframe nói | Màn hiện tại làm (file:dòng) | Verdict |
|---|---|---|
| "✓" rồi tiêu đề "Đặt hàng thành công" | Cốc `mug.svg` với 3 sao bật lên (`components/PaymentSuccess.tsx:46`), rồi `h1` "Đặt hàng thành công" (`PaymentSuccess.tsx:52`) | lệch có chủ đích: VP §6 mục 7 ("cốc với 3 sao bật lên"); đã ghi ở `docs/user-sequence-specifications.md` §2.6 mục A ("dấu ✓ phía trên tiêu đề của wireframe được thay bằng cốc minh họa") |
| "Mã đơn: #1042" | Chữ "Mã đơn: " rồi mã Fraunces `#xxxxxxxx`. Cổng API thật ra `#` + 8 ký tự đầu của mã đơn (`lib/payment/api-gateway.ts:87`), không phải 4 số `#1042` của wireframe. Chỉ cổng mock khi không có `orderId` mới ra `#` + 4 số (`lib/payment/mock-gateway.ts:5-6`; có `orderId` thì cũng 8 ký tự, `mock-gateway.ts:17`) | lệch có chủ đích: chữ cố định "Mã đơn: #xxxxxxxx" trong kế hoạch task (`docs/planning/2026-10-09-frontend-ui-plan.md:339`) và `PaymentResult.orderCode` (`lib/payment/types.ts:37`). Chữ "Mã đơn: " giữ nguyên, test `components/PaymentSuccess.test.ts:138` |
| "Trạng thái: PAID" (mã tiếng Anh) | Nhãn "Trạng thái:" (`PaymentSuccess.tsx:65`) rồi thanh 5 bước nhãn tiếng Việt, đang ở "Đã thanh toán" (`PaymentSuccess.tsx:68`; `lib/order-status.ts:28`; `components/OrderStatusTrack.tsx:43`). Thanh tự cập nhật khi barista đổi trạng thái | lệch có chủ đích: VP §6 mục 7 ("Trạng thái:" kèm thanh 5 bước) và `STATUS_LABEL` (`lib/order-status.ts:26`), nhãn tiếng Việt thay mã "PAID". VP §6 mục 10 (thẻ Lịch sử bỏ mã trạng thái tiếng Anh) chỉ là tiền lệ liên quan; đã ghi ở `docs/user-sequence-specifications.md` §2.6 mục C (dòng "Trạng thái: thanh 5 bước, đang ở Đã thanh toán") |
| "Mời tới quầy lấy nước" | Dải cam `Mời tới quầy lấy nước` (`PaymentSuccess.tsx:79`), đứng sau "Trạng thái" và "Đã trả", trước nút | khớp. Chữ giữ nguyên, test `PaymentSuccess.test.ts:74` và `:157` |
| Nút "Về trang chủ" (cuối màn) | Nút viền "Về trang chủ" (`PaymentSuccess.tsx:83`), `onHome` đẩy về `/` (`app/cart/page.tsx:106`) | khớp |
| Thứ tự: tiêu đề, Mã đơn, Trạng thái, Mời tới quầy, nút | Tiêu đề, Mã đơn (kèm "+N điểm tích lũy" khi có), Trạng thái, "Đã trả", dải "Mời tới quầy lấy nước", nút (`PaymentSuccess.tsx:52`, `:58`, `:65`, `:72`, `:79`, `:83`) | khớp về thứ tự. "Đã trả", "Đã giảm", "+N điểm tích lũy" là phần thêm (VP §6 mục 7, Task 5) |

## Tổng kết

| Verdict | Số dòng |
|---|---:|
| khớp | 10 |
| lệch có chủ đích | 19 |
| lệch không chủ đích | 0 |

29 dòng: Menu 5, Chi tiết 6, Giỏ hàng 5, Thanh toán 7, Xác nhận 6.

Hai chữ phải giữ nguyên trong app đều còn nguyên và có test: "Mời tới quầy lấy nước" (`PaymentSuccess.tsx:79`) và "Mã đơn: #xxxxxxxx" (`PaymentSuccess.tsx:58`).

Thay đổi tài liệu cùng commit: `docs/user-sequence-specifications.md` §2.6 mục C, dòng "Giao diện Wireframe" trước đây chỉ ghi "Khớp với Wireframe (5)"; nay nêu rõ hai chỗ lệch có chủ đích (✓ thay bằng cốc, "PAID" thay bằng thanh 5 bước) và dẫn tới bảng này. Không đổi sơ đồ PlantUML nào vì không có chữ nào của sơ đồ bị đổi.

## Câu hỏi mở cho người dùng

- Có đổi tên món "Latte" trong seed thành "Cà phê sữa" cho khớp wireframe đề không? (Đổi `backend/prisma/seed.ts:31` kéo theo DB đã seed, test backend và frontend, tài liệu và các artboard gọi món này là "Latte".)
