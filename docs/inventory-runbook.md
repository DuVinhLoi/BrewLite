# BREW-INVENTORY-01 — triển khai, cutover và demo kho

Nhánh `feat/ingredient-inventory`, baseline `73a6ccb`. Đây là hướng dẫn vận hành, **không phải bằng chứng đã triển khai**. Kết quả thực chạy ở [inventory-verification.md](inventory-verification.md); yêu cầu ở [SRS](requirements/srs.md), giao diện ở [contract](inventory-contract.md), quyết định ở [ADR-006](architecture/adr/006-ingredient-inventory-snapshots.md).

## Preflight và cutover

1. Sao lưu PostgreSQL và ghi release API/web tương thích. Tạm ngừng nhận đơn/thanh toán mới trong cửa sổ cutover; xác nhận không có request đang chạy. Kiểm kê nguyên liệu vật lý, tách các nguyên liệu đã pha sẵn (espresso/phin/cold brew/trân châu chín) khỏi hàng thô.
2. **Trước migration**, truy vấn chỉ đọc phát hiện đơn cũ chưa trả (schema chưa có marker):

   ```sql
   SELECT id, "userId", status, "createdAt"
   FROM "orders"
   WHERE status IN ('PENDING', 'PAYMENT_FAILED')
   ORDER BY "createdAt", id;
   ```

   Đối soát từng đơn với chủ đơn/vận hành. Không dùng migration/SQL tự hủy, không ước lượng nguyên liệu để giải phóng, không backfill snapshot từ số ly. Chưa giải quyết xong thì giữ cửa sổ đóng nhận đơn và ghi blocker cutover. Tất cả đơn legacy tiếp tục đường Product.stock cũ.
3. Tại `apps/api`, dùng DATABASE_URL đúng môi trường được cho phép rồi chạy các lệnh sau; không in connection string vào log:

   ```powershell
   npm.cmd ci
   npm.cmd run prisma:generate
   npm.cmd run prisma:migrate
   npm.cmd run prisma:seed
   npm.cmd run build
   ```

   Startup container hiện hành chạy `prisma migrate deploy` trước phục vụ. Migration chỉ thêm bảng/cột/check/foreign key, giữ sản phẩm/đơn/Product.stock. Seed tạo thiếu nguyên liệu với onHand/reserved=0 và công thức demo; update rỗng bảo toàn số dư và công thức đã sửa. `SEED_DEMO_USERS=true` chỉ bật tài khoản demo trong môi trường demo; không tự chạy seed mỗi restart. Chạy lại seed không phải cách bổ sung kho.
4. **Sau migration**, kiểm marker và số dư bằng các truy vấn chỉ đọc:

   ```sql
   SELECT id, status, "inventoryTracked"
   FROM "orders"
   WHERE "inventoryTracked" = false
     AND status IN ('PENDING', 'PAYMENT_FAILED');

   SELECT id, name, unit, "onHand", reserved
   FROM "ingredients"
   WHERE "onHand" < 0 OR reserved < 0 OR reserved > "onHand";

   SELECT oi."orderId", oi."ingredientId", oi.quantity
   FROM "order_ingredients" oi
   JOIN "orders" o ON o.id = oi."orderId"
   WHERE o."inventoryTracked" = false;
   ```

   Hai truy vấn bất biến cuối phải rỗng. Đối chiếu bản ghi legacy trước/sau, không xóa lịch sử. Marker false không bị thay thành true; mọi đơn mới phải true. Nếu còn legacy chưa trả, hoàn tất đối soát trước mở bán.
5. Đăng nhập Barista; nhập số kiểm kê ban đầu qua RECEIVE/ADJUST có lý do, đúng đơn vị. Kiểm GET ingredients/movements/recipes; menu và availability phản ánh số dư mới. Không nhập bằng UPDATE SQL, không suy gram/ml từ Product.stock. Mở nhận đơn sau khi API/web cùng hỗ trợ marker và smoke nghiệp vụ thành công.

## Nhập kho và demo Matcha

Trang `/inventory` chỉ hiển thị số dư nguyên liệu, nhập kho/kiểm đếm và lịch sử biến động. Theo yêu cầu điều chỉnh giao diện, đã bỏ bảng sửa công thức và bảng số ly có thể bán; công thức cố định vẫn phục vụ tính nguyên liệu cho đơn hàng. Phép tính số ly bên dưới là ví dụ kiểm chứng API; khách xem khả dụng tại chi tiết món và giỏ hàng.

Trên **DB demo sạch** sau seed, đăng nhập Barista bằng `POST /auth/login`; dùng accessToken làm Bearer token, không ghi token vào repo/log. Nguyên liệu tồn tại có thể đọc từ `GET /inventory/ingredients`. Với từng request, API đòi JWT Barista; Customer bị 403, Guest 401.

| POST endpoint | JSON body |
|---|---|
| `/inventory/ingredients/matcha/movements` | `{"kind":"RECEIVE","quantity":"20","unit":"g","reason":"Demo Matcha: counted opening stock"}` |
| `/inventory/ingredients/unsweetened-milk/movements` | `{"kind":"RECEIVE","quantity":"2000","unit":"ml","reason":"Demo Matcha: counted opening stock"}` |
| `/inventory/ingredients/sugar-syrup/movements` | `{"kind":"RECEIVE","quantity":"200","unit":"ml","reason":"Demo Matcha: counted opening stock"}` |

Không chạy lặp ba RECEIVE trên DB vận hành để “reset”: mỗi lần sẽ cộng lượng và ghi nhật ký. Có số dư trước thì tính theo số kiểm kê thật và dùng ADJUST final onHand (không thấp hơn reserved).

Gọi `POST /inventory/availability` với `{"items":[{"productId":"matcha-latte","size":"S","toppings":[],"quantity":1}]}` (xác nhận product ID thực tế từ `GET /products`). Công thức S cần 3g matcha, 150ml sữa không đường, 20ml syrup: `min(floor(20/3),floor(2000/150),floor(200/20)) = min(6,13,10) = 6`; matcha là nguyên liệu giới hạn. Quantity 7 cho canOrder=false và shortage matcha 21g cần/20g còn. Hai dòng chia sẻ matcha cũng phải cộng trước kiểm.

Có thể chứng minh chuyển đơn vị bằng RECEIVE `0.020 kg` thay 20g hoặc `2 l` thay 2000ml, **không gửi cả hai**. ADJUST quantity là số kiểm kê cuối, còn StockMovement.quantity là delta có dấu; dữ liệu trả về dạng chuỗi thập phân. Không đổi g↔ml; piece phải nguyên.

Đặt 2 Matcha S: reserved tăng 6g/300ml/40ml, onHand giữ nguyên. Thanh toán thất bại trên VNPay (IPN hoặc `sync` đưa đơn về `PAYMENT_FAILED`) giữ số dư/snapshot; hủy bằng chủ đơn chỉ giảm reserved. Hủy lần hai bị 409. Đơn mới trả WALLET thành công trên VNPay (IPN hoặc `POST /payments/:id/sync` xác nhận) tiêu thụ snapshot; replay cùng key trả 200 không tiêu thụ thêm. Sửa công thức sau giữ chỗ rồi thanh toán/hủy phải vẫn dùng lượng snapshot cũ.

## Công thức seed và giả định demo

| Sản phẩm size S | Định lượng nguyên liệu chuẩn |
|---|---|
| Americano | espresso 30ml |
| Bạc xỉu | prepared-phin 30ml; condensed-milk 25ml; unsweetened-milk 100ml |
| Cà phê sữa | ground-phin 25g; condensed-milk 25ml |
| Cappuccino | espresso 30ml; whole-milk 120ml |
| Cold brew | filtered-cold-brew 200ml |
| Matcha latte | matcha 3g; unsweetened-milk 150ml; sugar-syrup 20ml |
| Trà đào | black-tea 5g; peach-syrup 30ml; peach 3piece |
| Trà sữa trân châu | black-tea 5g; unsweetened-milk 80ml; condensed-milk 25ml; cooked-pearls 50g |

M=S×1.25 và L=S×1.5, lưu công thức riêng, làm tròn **lên** đối với peach piece (M=4, L=5). Topping thêm trân châu/kem phô mai/thạch dừa lần lượt 20g cooked-pearls/cheese-foam/coconut-jelly; trân châu thêm cộng vào phần đã có trong trà sữa. Đây là giả định demo, không chuẩn định lượng sản xuất. Nước/đá không giới hạn. Chuyển hàng thô thành espresso/phin/cold brew lọc/trân châu chín, hao hụt, supplier, giá vốn và expiry ngoài phạm vi.

## Sự cố và rollback

- 409 OUT_OF_STOCK: giữ giỏ, đọc shortage tổng hợp và điều chỉnh; không tự nới số dư. RECIPE_UNAVAILABLE: Barista kiểm/sửa công thức đầy đủ. BELOW_RESERVED: đối chiếu đơn đang giữ và số kiểm kê thật; không ép giảm reserved bằng SQL.
- Thanh toán thất bại/khách rời trang không tự giải phóng. Chủ đơn có thể hủy PENDING/PAYMENT_FAILED; không có tác vụ tự hủy hoặc timeout. Đơn đã trả không hoàn nguyên liệu/hoàn tiền trong phạm vi này.
- Sau phát sinh đơn marker true, **không rollback về API cũ chưa hiểu ingredient inventory**: hủy/thanh toán có thể đi sai Product.stock lifecycle. Đóng nhận đơn, giữ DB additive và triển khai bản sửa tương thích marker/snapshot. Chỉ rollback image/web khi bản đích cùng hiểu cả true/false; diễn tập trên bản sao DB trước.
- Bản sao lưu chỉ phục hồi trong quy trình khôi phục được duyệt, có đối soát các giao dịch sau thời điểm backup; không xóa bảng mới để làm schema giống bản cũ.

Theo yêu cầu bàn giao cuối, bộ test dự án được loại khỏi bản phân phối **sau khi kiểm chứng**. Các đường dẫn/test ID trong tài liệu cũ là bằng chứng lịch sử, không cam kết bộ suite còn chạy từ bản cuối. Đọc verification để biết lệnh đã thực chạy, kết quả, thời điểm và giới hạn; runbook này không gắn trạng thái PASS cho bước chưa chạy.
