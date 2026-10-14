# BIỂU ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) – BREWLITE
## LUỒNG ĐẶT MÓN, THANH TOÁN & XỬ LÝ HÀNG ĐỢI QUẦY

> **Dự án:** BrewLite – Ứng dụng đặt cà phê không tiền mặt  
> **Môn học:** Công nghệ Phần mềm (Bài tập lớn 10 Task Agile Scrum)  
> **Tài liệu tham chiếu:** [BrewLite-CongNghePhanMem-fixed.md](BrewLite-CongNghePhanMem-fixed.md) (đề), [use-case-specifications.md](use-case-specifications.md) (đặc tả Use Case), [user-sequence-specifications.md](user-sequence-specifications.md) (sequence chi tiết từng UC)  
> **Phạm vi:** 2 biểu đồ hoạt động ở mức nghiệp vụ. **AD1** là luồng khách đặt món và thanh toán không tiền mặt (đề §5; UC01–UC07, UC05a). **AD2** là luồng nhân viên xử lý hàng đợi quầy (UC08–UC12, mở rộng ngoài đề §3.2). Hai biểu đồ vẽ theo **mã nguồn hiện tại**: đề là nguồn yêu cầu, code là nguồn để vẽ.

---

## QUY ƯỚC ĐỌC BIỂU ĐỒ

| Ký hiệu | Ý nghĩa |
| :--- | :--- |
| Chấm đen (`start`) / chấm có viền (`stop`) | Điểm bắt đầu / điểm kết thúc của luồng. |
| Hình bo tròn | Một hành động (action) của tác nhân ở làn chứa nó. |
| Hình thoi (`if`) | Điểm rẽ nhánh (decision); nhãn trên mũi tên là điều kiện của nhánh. |
| Vòng `repeat` | Bước lặp lại cho tới khi điều kiện cuối vòng không còn đúng (mua thêm, thử lại, tự làm mới). |
| Làn (swimlane) `\|Tên\|` | Ai làm bước đó. Chỉ có 3 làn ở mức nghiệp vụ: người dùng, **Hệ thống BrewLite** (gộp Frontend, Backend, CSDL) và **Cổng thanh toán (mock)**. |
| Ghi chú vàng (`note`) | Tên endpoint và mã HTTP của nhánh rẽ. Tên endpoint không nằm trong tên hành động để sơ đồ đọc được khi in A4. |

Mỗi biểu đồ có 3 mục: **A. Bối cảnh**, **B. Sơ đồ (PlantUML)**, **C. Bảng đối chiếu** (nút trên sơ đồ, endpoint, mã HTTP, `file:hàm` trong code).

---

## AD1. ĐẶT MÓN & THANH TOÁN KHÔNG TIỀN MẶT (đề §5; UC01–UC07, UC05a)

### A. Bối cảnh
Đây là luồng chính (happy path) của MVP ở đề §5: mở app, xem menu, chọn món (size, topping), thêm vào giỏ, xem giỏ, đăng nhập nếu chưa, thanh toán không tiền mặt, nhận mã đơn rồi nhận đồ uống. Giỏ hàng nằm ở máy khách (UC02); **đơn chỉ được tạo trong lần bấm "Xác nhận trả"** (UC04 rồi UC05 liền nhau, sau bước áp mã giảm giá UC05a), nên bước đăng nhập của đề §5 trong code là bước chặn khi bấm trả: chưa có token thì `POST /orders` trả 401 và khách được đưa về `/login?next=/cart` (UC03).
Nhánh lỗi của đề §5 ("hủy / thanh toán lỗi, về giỏ") là `PAYMENT_FAILED`: khách bấm trả lại với cùng khóa chống trùng (UC06 KB1), hoặc hủy đơn ở `/history` (UC06 KB2). Chi tiết từng bước xem sequence §2.1–§2.6 trong [user-sequence-specifications.md](user-sequence-specifications.md).

### B. Sơ đồ (PlantUML)
```plantuml
@startuml
skinparam shadowing false
skinparam wrapWidth 170
skinparam ActivityDiamondFontSize 11
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam ActivityBackgroundColor #eef2fb
skinparam ActivityBorderColor #5b6b8c
skinparam ActivityDiamondBackgroundColor #fdf3d8
skinparam ActivityDiamondBorderColor #b8860b
skinparam NoteBackgroundColor #fffbe6
skinparam NoteBorderColor #b8860b
skinparam SwimlaneBorderColor #5b6b8c
skinparam SwimlaneTitleFontColor #1f2937

|Khách hàng|
start
:Mở app;
|Hệ thống BrewLite|
:Hiện menu các món còn hàng;
note right
  GET /products (chỉ món có tồn kho)
  Lỗi tải: báo lỗi và nút Thử lại
end note
repeat
  |Khách hàng|
  :Chọn một món;
  |Hệ thống BrewLite|
  :Mở chi tiết món, tải giá và tồn kho mới;
  note right
    GET /products/:id
    404 Product not found, FE báo "Sản phẩm không tồn tại."
  end note
  |Khách hàng|
  :Chọn size S/M/L, topping, số lượng;
  |Hệ thống BrewLite|
  if (Hết hàng, quá 20 dòng hoặc quá 99 ly?) then (có)
    :Từ chối, giữ nguyên giỏ, báo lý do;
  else (không)
    :Thêm vào giỏ (lưu trên máy khách);
  endif
  :Hiện giỏ và tổng tiền;
  |Khách hàng|
repeat while (Mua thêm?) is (có) not (không)
:Chọn Ví / Thẻ, nhập mã giảm giá, bấm Xác nhận trả;
|Hệ thống BrewLite|
if (Chưa đăng nhập hoặc token hết hạn?) then (có)
  :Báo thiếu đăng nhập, chuyển sang trang đăng nhập;
  note right
    FE biết qua 401 của POST /orders
    hoặc POST /payments, không chặn trước
    Giỏ và phiên thanh toán được giữ
  end note
  |Khách hàng|
  :Đăng nhập hoặc đăng ký;
  note right
    POST /auth/login, POST /auth/register
  end note
  :Quay lại giỏ theo ?next=, bấm Xác nhận trả;
endif
|Hệ thống BrewLite|
:Tạo đơn PENDING, server tính lại giá;
note right
  POST /orders + Idempotency-Key
  Thử lại dùng orderId đã nhớ, không tạo đơn mới
end note
repeat
  :Tính giảm giá, gọi cổng trừ tiền;
  note right
    POST /payments + Idempotency-Key
    BREWLITE10 giảm 10%, mã khác giảm 0
    Thử lại: PAYMENT_FAILED về PENDING trước
  end note
  |Cổng thanh toán (mock)|
  :Trừ tiền bằng Ví hoặc Thẻ;
  |Hệ thống BrewLite|
  if (Cổng chấp nhận?) then (từ chối)
    :Đặt đơn PAYMENT_FAILED, báo lỗi, giữ giỏ;
    note right
      400 "Payment failed"
      Chưa trừ kho nên không hoàn kho
    end note
  else (chấp nhận)
    :Trừ kho, đặt đơn PAID, cộng điểm, lưu biên lai;
    note right
      4 lệnh ghi trong 1 transaction
      Kho trừ theo version, thử tối đa 3 lần
    end note
    if (Ghi thành công?) then (kẹt kho)
      |Cổng thanh toán (mock)|
      :Hoàn đúng số tiền đã trừ;
      |Hệ thống BrewLite|
      :Đặt đơn PAYMENT_FAILED, báo "Món đã hết hàng";
      note right
        409 Out of stock, rollback phần kho đã trừ
      end note
    else (thành công)
      :Trả biên lai: mã đơn, giảm giá, điểm cộng;
      note right
        201 (khóa đã có biên lai: 200, không trừ lần 2)
      end note
    endif
  endif
repeat while (Đơn chưa PAID và khách thử lại?) is (thử lại) not (xong)
if (Đơn đã PAID?) then (chưa, khách bỏ)
  |Khách hàng|
  :Hủy đơn ở trang Lịch sử;
  |Hệ thống BrewLite|
  :Đặt đơn CANCELLED;
  note right
    PATCH /orders/:id (CANCELLED): 200
    Đơn chưa PAID: không hoàn tiền, không hoàn kho
    (đơn PAID hủy ở Lịch sử: có hoàn, xem bảng C)
  end note
  stop
else (đã PAID)
endif
|Khách hàng|
:Xem biên lai "Đặt hàng thành công", "+N điểm";
|Hệ thống BrewLite|
repeat
  :Tự làm mới trạng thái đơn mỗi 3 giây;
  note right
    GET /orders/:id
    Barista xử lý đơn ở AD2
  end note
repeat while (Chưa COMPLETED và chưa CANCELLED?) is (chưa) not (xong)
if (Đơn COMPLETED?) then (có)
  |Khách hàng|
  :Nhận đồ uống tại quầy;
else (CANCELLED)
  |Khách hàng|
  :Biên lai hiện "Đã hủy";
  note right
    Đơn PAID bị hủy (Barista ở AD2, hoặc khách ở Lịch sử):
    server đã hoàn tiền và hoàn kho
  end note
endif
stop
@enduml
```

### C. Bảng đối chiếu

| Nút / nhánh trên sơ đồ | Endpoint và mã HTTP | `file:hàm` trong code |
| :--- | :--- | :--- |
| Hiện menu các món còn hàng | `GET /products` 200 | `backend/src/product/product.controller.ts:list` → `ProductService.listAvailable` → `PrismaProductRepo.findAvailable` (`stock > 0`); FE `frontend/src/lib/api.ts:getProducts` |
| Mở chi tiết món | `GET /products/:id` 200 / 404 `Product not found` (FE báo "Sản phẩm không tồn tại." ở `api.ts:getProduct`) | `product.controller.ts:detail` → `ProductService.getById`; FE `api.ts:getProduct`, `frontend/src/components/ProductDetailModal.tsx` |
| Chọn size S/M/L, topping, số lượng | không gọi API (tính ở máy khách) | `ProductDetailModal.tsx`, `frontend/src/lib/pricing.ts:calcUnitPrice` |
| Hết hàng, quá 20 dòng hoặc quá 99 ly (từ chối) | không gọi API | `frontend/src/store/cart.ts:addItem` (lý do `OUT_OF_STOCK`, `MAX_LINES`, `MAX_QTY`, `AT_STOCK_LIMIT`), `frontend/src/lib/cart-limits.ts` |
| Thêm vào giỏ, hiện giỏ và tổng tiền | không gọi API (Zustand + localStorage) | `store/cart.ts:addItem`, `frontend/src/app/cart/page.tsx`, `frontend/src/components/cart/CartView.tsx` |
| Mua thêm | quay lại menu `/` | `CartView.tsx` (link "Về Menu"), `frontend/src/app/page.tsx` |
| Chọn Ví / Thẻ, nhập mã giảm giá (UC05a); và "Tính giảm giá" ở server | FE tạm tính (không gọi API); server tính lại trong `POST /payments`: `BREWLITE10` giảm 10% làm tròn xuống, mã khác giảm 0 (không báo lỗi) | `frontend/src/components/PaymentForm.tsx` (`discount`, `final`), `frontend/src/lib/promo.ts`; `backend/src/payment/payment.service.ts:pay` (`VOUCHER_CODE`, `VOUCHER_RATE`) |
| Chưa đăng nhập hoặc token hết hạn (FE chỉ biết qua 401, không chặn trước) | `POST /orders` hoặc `POST /payments` 401 | `frontend/src/lib/payment/api-gateway.ts:pay` (ném `PaymentError` status 401), `checkout-session.ts:isUnauthorizedPayment`, `PaymentForm.tsx:handleConfirm` → `frontend/src/lib/session.ts:handleUnauthorized` (về `/login?next=...`) |
| Đăng nhập hoặc đăng ký, quay lại `/cart` | `POST /auth/login` 200 (đăng nhập) / `POST /auth/register` 201; sai thông tin 401, trùng email 409 | `backend/src/auth/auth.controller.ts`; FE `frontend/src/app/login/page.tsx:submit`, `session.ts:postLoginTarget`, `safeNext`, `checkout-session.ts:clearCheckoutIfOtherUser` |
| Tạo đơn PENDING, server tính lại giá (một lần cho mỗi giỏ; thử lại dùng `orderId` đã nhớ) | `POST /orders` 201 mới / 200 cùng khóa. Chỉ gặp khi gọi API tay: 404 món lạ, 400 topping lạ / quá 20 dòng / quá 99 ly / tổng quá lớn / khóa quá 255 ký tự, 403 tài khoản nhân viên, 422 khóa của người khác | `backend/src/order/order.controller.ts:create` → `OrderService.create`, `replay` (khóa người khác: 422); giá: `backend/src/order/pricing.ts`; DTO: `backend/src/order/dto/create-order.dto.ts`; vai trò: `@Roles(Role.CUSTOMER)` (nhân viên 403 `Insufficient role`) |
| Tính giảm giá, gọi cổng trừ tiền (ngoài transaction) | `POST /payments` 201 / 200 (khóa đã có biên lai: trả biên lai cũ, không trừ lần 2); gọi tay: 403 đơn người khác, 422 khóa đã dùng cho đơn khác, 400 `Invalid transition` nếu đơn không ở PENDING / PAYMENT_FAILED | `backend/src/payment/payment.controller.ts:pay` → `PaymentService.processPayment` → `pay`; `MockPaymentGatewayService.charge` |
| Trừ tiền bằng Ví hoặc Thẻ | gọi nội bộ, không có endpoint | `backend/src/payment/mock-payment-gateway.service.ts:charge`; từ chối khi `MOCK_GATEWAY_DECLINE_METHOD` trùng phương thức |
| Cổng từ chối → `PAYMENT_FAILED` | 400 `Payment failed` | `payment.service.ts:pay` (`catch` quanh `gateway.charge`), `backend/src/state-machine/order-state.machine.ts:assertTransition` (`PENDING -> PAYMENT_FAILED`) |
| Vòng "Đơn chưa PAID và khách thử lại?" (đơn về `PENDING` rồi trừ tiền lại) | `POST /payments`, cùng `Idempotency-Key` | `payment.service.ts:pay` (`PAYMENT_FAILED -> PENDING` rồi `gateway.charge` lại); FE `PaymentForm.tsx:handleConfirm` (`...(orderId ? { orderId } : { items, orderIdempotencyKey })`) và `api-gateway.ts:pay` (`req.orderId ?? createOrderId`) nên thử lại không gọi `POST /orders`, `checkout-session.ts:loadCheckout`, `dropsCheckout` |
| Hủy đơn ở trang Lịch sử (khách bỏ, đơn `PENDING` / `PAYMENT_FAILED`: không hoàn tiền, không hoàn kho) | `PATCH /orders/:id` `{ status: "CANCELLED" }` 200; đơn người khác 403; không có đơn 404 | `backend/src/payment/payment.controller.ts:update` → `PaymentService.cancelOrderAs` → `cancelOrder`; FE `api.ts:cancelOrder` (nút Hủy đơn ở `/history`) |
| Hủy đơn đã `PAID` ở trang Lịch sử (không vẽ nhánh riêng, ghi ở note biên lai) | `PATCH /orders/:id` `{ status: "CANCELLED" }` 200, có hộp xác nhận hoàn tiền | `frontend/src/lib/order-status.ts:canCancel` (gồm `PAID`), `frontend/src/app/history/page.tsx`; `payment.service.ts:cancel` (cộng biên lai `SUCCESS`, `gateway.refund` ngoài transaction, rồi `restoreStock` + `CANCELLED` trong 1 transaction) |
| Trừ kho, đặt đơn `PAID`, cộng điểm, lưu biên lai | cùng `POST /payments` | `payment.service.ts:pay` trong `orders.runInTransaction`: `products.deductStockWithOptimisticLock` (thử lại 3 lần), `orders.updateStatus`, `users.addLoyaltyPoints`, `payments.save`; `LOYALTY_RATE`, `VND_PER_POINT` |
| Kẹt kho hoặc lỗi ghi → hoàn tiền, `PAYMENT_FAILED` | 409 `Out of stock` (hoặc 404 / 500 theo lỗi gốc) | `payment.service.ts:pay` (`catch` sau `runInTransaction`: `gateway.refund` rồi `updateStatus(PAYMENT_FAILED)`); FE `api-gateway.ts:paymentErrorMessage` ("Món đã hết hàng, tiền đã được hoàn lại") |
| Trả biên lai: mã đơn, giảm giá, điểm cộng | `POST /payments` 201 | `payment.service.ts:pay` (kết quả), FE `api-gateway.ts:pay` → `PaymentResult`; `frontend/src/components/PaymentSuccess.tsx:PaymentReceipt` ("Mã đơn", "+N điểm tích lũy", "Đã giảm") |
| Tự làm mới trạng thái đơn mỗi 3 giây | `GET /orders/:id` 200 / 403 đơn người khác / 404 | `backend/src/order/order.controller.ts:byId` → `OrderService.getById`; FE `frontend/src/lib/use-order-poll.ts:useOrderPoll` (`POLL_INTERVAL_MS = 3000`), `api.ts:getOrder`, `frontend/src/components/OrderStatusTrack.tsx` |
| Đơn `COMPLETED`: nhận đồ uống | không gọi API | trạng thái do Barista đặt (AD2); `lib/order-status.ts` (`isTerminal`) dừng poll ở `COMPLETED` / `CANCELLED` |
| Đơn `CANCELLED`: biên lai hiện "Đã hủy" | không gọi API | `lib/order-status.ts` (`STATUS_LABEL`, nhãn "Đã hủy"), `PaymentSuccess.tsx:receiptStatus`; hoàn tiền và hoàn kho do server làm lúc hủy đơn `PAID` (`payment.service.ts:cancel`), giao diện không có câu hoàn tiền |

---

## AD2. BARISTA XỬ LÝ HÀNG ĐỢI (UC08–UC12)

### A. Bối cảnh
Phân hệ quầy là **mở rộng ngoài đề §3.2** nhưng có trên biểu đồ Use Case Bản 1: nhân viên đăng nhập, vào `/barista`, xem hàng đợi 3 cột (UC08), rồi lần lượt đẩy từng đơn theo Order State Machine đề §9.1: `PAID → PREPARING → READY → COMPLETED` (UC09–UC11) hoặc hủy đơn `PAID` vì hết nguyên liệu (UC12, hoàn tiền qua cổng rồi hoàn kho). Admin kế thừa Barista (`Admin --|> Barista` ở Use Case Bản 1) nên đi cùng luồng này; khách hàng gọi các API quầy bị 403.
Vòng `repeat` là một phiên làm việc ở quầy: sau mỗi thao tác, hàng đợi được tải lại và tự tải lại mỗi 5 giây cho tới khi hết đơn. Chi tiết xem sequence §2.7 trong [user-sequence-specifications.md](user-sequence-specifications.md).

### B. Sơ đồ (PlantUML)
```plantuml
@startuml
skinparam shadowing false
skinparam wrapWidth 220
skinparam ActivityDiamondFontSize 11
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam ActivityBackgroundColor #eef2fb
skinparam ActivityBorderColor #5b6b8c
skinparam ActivityDiamondBackgroundColor #fdf3d8
skinparam ActivityDiamondBorderColor #b8860b
skinparam NoteBackgroundColor #fffbe6
skinparam NoteBorderColor #b8860b
skinparam SwimlaneBorderColor #5b6b8c
skinparam SwimlaneTitleFontColor #1f2937

|Barista / Admin|
start
:Đăng nhập tài khoản nhân viên;
|Hệ thống BrewLite|
:Xác thực và chuyển tới trang Quầy;
note right
  POST /auth/login: 200
  Barista về /barista; Admin về /admin, bấm "Quầy" để vào
end note
if (Vai trò là BARISTA hoặc ADMIN?) then (không phải)
  :Hiện "Trang này dành cho tài khoản quầy";
  note right
    Giao diện chặn, không gọi API
    Gọi GET /orders bằng token khách: 403 Insufficient role
  end note
  stop
else (đúng)
endif
repeat
  :Tải hàng đợi: Chờ pha, Đang pha, Sẵn sàng;
  note right
    GET /orders?status=PAID,PREPARING,READY: 200, cũ nhất trước
    401: về /login?next=/barista
    403: ngừng tự tải lại
  end note
  |Barista / Admin|
  :Chọn một đơn và bấm nút của cột;
  note right
    Chờ pha: Nhận pha, Hủy (hết nguyên liệu)
    Đang pha: Pha xong
    Sẵn sàng: Đã giao
  end note
  |Hệ thống BrewLite|
  if (Thao tác?) then (Hủy hết nguyên liệu)
    if (Đơn đang PAID?) then (không)
      :Từ chối, báo lỗi trên màn Quầy;
      note right
        PENDING hoặc PAYMENT_FAILED: 403
        PREPARING trở đi: 400 Invalid transition
      end note
    else (PAID)
      :Cộng các biên lai SUCCESS của đơn;
      note right
        PATCH /orders/:id (status CANCELLED)
      end note
      |Cổng thanh toán (mock)|
      :Hoàn đúng số tiền đã thu;
      note right
        Ngoài transaction
        Không có biên lai SUCCESS: không hoàn
      end note
      |Hệ thống BrewLite|
      :Hoàn kho mọi món, đặt đơn CANCELLED;
      note right
        Cùng 1 transaction: lỗi thì rollback, đơn vẫn PAID
      end note
    endif
  else (Tiến đơn)
    if (Đúng bước kế của máy trạng thái?) then (sai, nhảy cóc hoặc đi lùi)
      :Từ chối, báo lỗi trên màn Quầy;
      note right
        PATCH /orders/:id (status PREPARING, READY, COMPLETED)
        400 Invalid transition; đơn không tồn tại: 404
        Khách gọi tay: 403 Only staff can advance orders
      end note
    else (đúng)
      :Đổi trạng thái đơn;
      note right
        PAID → PREPARING → READY → COMPLETED: 200
      end note
    endif
  endif
  :Tải lại hàng đợi ngay;
  |Barista / Admin|
repeat while (Còn đơn trong hàng đợi?) is (còn) not (hết)
stop
@enduml
```

### C. Bảng đối chiếu

| Nút / nhánh trên sơ đồ | Endpoint và mã HTTP | `file:hàm` trong code |
| :--- | :--- | :--- |
| Đăng nhập tài khoản nhân viên, chuyển tới trang Quầy | `POST /auth/login` 200; sai thông tin 401 | `backend/src/auth/auth.controller.ts`; FE `frontend/src/app/login/page.tsx:submit`, `frontend/src/lib/session.ts:postLoginTarget`, `frontend/src/lib/auth.ts:homeFor` (`BARISTA` → `/barista`, `ADMIN` → `/admin`) |
| Vai trò không phải BARISTA / ADMIN | không gọi API; gọi tay `GET /orders` 403 `Insufficient role` | `frontend/src/components/BaristaView.tsx` (nhánh `!staff`), `frontend/src/lib/barista.ts:isStaff`; `backend/src/auth/roles.guard.ts` |
| Tải hàng đợi | `GET /orders?status=PAID,PREPARING,READY` 200; trạng thái lạ 400; 401; 403 | `backend/src/order/order.controller.ts:queue` (`@Roles(Role.BARISTA, Role.ADMIN)`) → `OrderService.listQueue` → `findByStatuses` (`createdAt` tăng dần); FE `frontend/src/lib/barista.ts:fetchQueue`, `groupQueue`, `POLL_MS = 5000`; `frontend/src/app/barista/page.tsx:load` |
| Chọn đơn, bấm nút của cột | không gọi API đến khi bấm | `frontend/src/lib/barista.ts:cardActions`, `ACTION_LABEL`; `BaristaView.tsx` |
| Thao tác: Tiến đơn | `PATCH /orders/:id` `{ status: "PREPARING" \| "READY" \| "COMPLETED" }` 200; khách 403; không có đơn 404 | `backend/src/payment/payment.controller.ts:update` → `PaymentService.advanceOrder` (`isStaff`); FE `frontend/src/lib/api.ts:advanceOrder`, `frontend/src/app/barista/page.tsx:act` |
| Đúng bước kế của máy trạng thái? | 400 `Invalid transition A -> B` | `backend/src/state-machine/order-state.machine.ts:assertTransition` (bảng `ALLOWED`); FE dịch lỗi ở `api.ts:transitionError` |
| Đổi trạng thái đơn | `PATCH /orders/:id` 200 | `payment.service.ts:advanceOrder` (`orders.updateStatus` dưới khóa `order:<orderId>`) |
| Thao tác: Hủy hết nguyên liệu | `PATCH /orders/:id` `{ status: "CANCELLED" }` | `payment.controller.ts:update` → `PaymentService.cancelOrderAs` → `cancelOrder`; FE `api.ts:cancelOrder`, hộp xác nhận ở `barista/page.tsx` (`window.confirm`) |
| Đơn đang PAID? (không) | 403 `Staff can only cancel paid orders` (PENDING, PAYMENT_FAILED); 400 `Invalid transition` (PREPARING trở đi) | `payment.service.ts:cancelOrderAs` (nhánh `isStaff`), `assertTransition` |
| Cộng các biên lai SUCCESS của đơn | không có endpoint | `payment.service.ts:cancel` (`payments.findAllByOrderId`, lọc `status === 'SUCCESS'`) |
| Hoàn đúng số tiền đã thu (ngoài transaction) | gọi nội bộ | `payment.service.ts:cancel` → `mock-payment-gateway.service.ts:refund` |
| Hoàn kho mọi món, đặt đơn CANCELLED | `PATCH /orders/:id` 200 | `payment.service.ts:cancel` trong `orders.runInTransaction`: `products.restoreStock`, `orders.updateStatus(CANCELLED)` |
| Tải lại hàng đợi ngay | `GET /orders?status=PAID,PREPARING,READY` | `barista/page.tsx:act` gọi `load()` sau mỗi PATCH; vòng tự tải lại `setInterval(load, POLL_MS)` |
