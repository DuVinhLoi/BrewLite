# Bối cảnh, stakeholder và phạm vi (Task 1.1)

> **Bản chốt Task 1**, theo phạm vi tối thiểu đã thống nhất ở PR #5 và đã rút gọn thêm (SRS mục 1.4).
>
> Tài liệu này trả lời đề A2 §3.1. Đề A2: [`../Assignment2-BrewLite.md`](../Assignment2-BrewLite.md). Bối cảnh lấy từ đề A1 (chỉ để tham khảo): [`../BrewLite-CongNghePhanMem-fixed.md`](../BrewLite-CongNghePhanMem-fixed.md) §3. Đọc kèm: [`srs.md`](srs.md), [`uc-checkout.md`](uc-checkout.md), [`use-case-overview.svg`](use-case-overview.svg).
>
> Phạm vi bản nộp đã chốt ở SRS mục 1.4 và 8. Việc chọn cách triển khai và ghi quyết định kiến trúc (ADR) thuộc các task sau.

## Mục lục

1. Vấn đề nghiệp vụ
2. Stakeholder: mục tiêu và kỳ vọng
3. Phạm vi
   - 3.1 Trong phạm vi MVP (in-scope)
   - 3.2 Phạm vi mở rộng
   - 3.3 Ngoài phạm vi (out-of-scope)
4. Giả định
5. Ràng buộc
6. Rủi ro ban đầu

---

## 1. Vấn đề nghiệp vụ

Ở quán cà phê, khách thường phải **xếp hàng gọi món rồi trả tiền mặt**. Giờ cao điểm hàng dài, nhân viên vừa ghi order vừa thối tiền nên dễ nhầm món, nhầm tiền. Còn khách thì không biết ly của mình đang pha tới đâu.

**BrewLite** là ứng dụng web ưu tiên điện thoại (PWA: trang web có thể "cài" ra màn hình chính như một app). Khách **tự chọn đồ uống, chọn size và topping, đặt đơn và trả tiền không cần tiền mặt** chỉ với vài lần chạm, rồi **theo dõi đơn** cho tới lúc nhận nước. Tầm nhìn sản phẩm (đề A1 §3.1): giúp khách đặt và trả tiền đồ uống không dùng tiền mặt, bớt thời gian xếp hàng và nhận đồ nhanh tại quầy.

Hệ thống cần làm tốt bốn việc:

- **Gọi đúng món:** khách thấy menu, giá và tùy chọn trước khi đặt; máy chủ tự tính tiền nên không sai.
- **Trả tiền an toàn, không cần tiền mặt:** trả bằng ví hoặc thẻ qua cổng VNPay sandbox (môi trường thử của VNPay, không trừ tiền thật); lỡ bấm gửi lại cũng không bị trừ tiền hai lần.
- **Không bán quá số nguyên liệu còn:** hệ thống cộng nhu cầu nguyên liệu của cả giỏ, giữ chỗ ngay lúc đặt đơn và chỉ trừ hẳn khi khách trả tiền thành công.
- **Trạng thái đơn rõ ràng:** mỗi đơn đi qua các trạng thái `PENDING` (chờ thanh toán), `PAID` (đã trả), `PAYMENT_FAILED` (trả không thành công), `PREPARING` (đang pha), `READY` (xong, chờ lấy), `COMPLETED` (đã giao), `CANCELLED` (đã hủy); khách xem lại được trong lịch sử.

Luồng tối thiểu theo đề A2 §1.1: **Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn**.

---

## 2. Stakeholder: mục tiêu và kỳ vọng

Sáu bên liên quan theo đề A2 §3.1 (mô tả gốc ở đề A1 §3.2).

| # | Stakeholder | Vai trò với hệ thống | Mục tiêu | Kỳ vọng |
|---|---|---|---|---|
| S1 | Khách hàng | Người dùng cuối, đặt và trả tiền đồ uống | Đặt nhanh, không phải xếp hàng, không cần tiền mặt, biết đơn đang tới đâu | Menu ghi rõ giá; chọn size, topping dễ; thấy đúng tổng tiền trước khi trả; trả lỗi thì không mất tiền và giỏ vẫn còn; xem lại được các đơn cũ; dùng thoải mái trên điện thoại |
| S2 | Nhân viên quầy (Barista) | Nhận đơn đã trả tiền và pha chế | Biết đơn nào cần làm, cập nhật tiến độ đúng, không pha nhầm đơn chưa trả | Tìm đơn theo mã trên biên lai demo; chỉ bắt đầu pha khi đơn đã `PAID`; đổi trạng thái đúng thứ tự `PAID → PREPARING → READY → COMPLETED`, đổi sai thì hệ thống chặn. Cập nhật tiến độ đơn qua API; quản lý nguyên liệu và công thức trên màn `/inventory` và qua API (FR-29) |
| S3 | Quản lý cửa hàng (Product Owner) | Đưa ra yêu cầu, xếp thứ tự ưu tiên công việc (backlog), nghiệm thu sau mỗi lần bàn giao (Increment) | Nhiều đơn trả không tiền mặt hơn, khách bớt xếp hàng, số liệu đơn đáng tin | Phạm vi MVP rõ, giao đúng hẹn; số liệu đơn và tiền không lệch; khuyến mãi và điểm thưởng có sẵn trong mô hình để mở rộng sau; xem được tồn nguyên liệu, công thức và lịch sử nhập/xuất kho; quản trị menu và voucher để sau |
| S4 | Giảng viên / khách hàng nghiệm thu | Chấm bài, đánh giá cả quy trình lẫn sản phẩm | Thấy được nhóm đi đủ chuỗi yêu cầu → thiết kế → code → CI/CD → production | Tài liệu đủ và khớp nhau (SRS, sơ đồ, ADR, ma trận truy vết); lịch sử commit/PR rõ ràng; link production chạy được lúc chấm; nhóm trình bày được lý do của từng quyết định |
| S5 | Nhóm phát triển | Phân tích, thiết kế, lập trình, kiểm thử, triển khai | Giao hệ thống chạy được, đạt tiêu chí chấp nhận, đúng hạn từng task | Yêu cầu rõ và kiểm chứng được để viết test; khối lượng vừa sức hai Sprint; công cụ miễn phí chạy ổn; yêu cầu không bị đổi giữa chừng nếu không qua PR |
| S6 | Đơn vị thanh toán (VNPay sandbox) | Cổng thanh toán bên thứ ba, là **hệ thống bên ngoài** BrewLite; bài dùng môi trường sandbox (môi trường thử), không thu tiền thật | Nhận yêu cầu thanh toán có chữ ký hợp lệ; báo rõ thành công hay thất bại qua IPN (VNPay gọi thẳng về máy chủ BrewLite); trả lời được khi BrewLite hỏi lại bằng QueryDR (API tra cứu giao dịch của VNPay) | BrewLite tạo link thanh toán đúng thông tin (số tiền, mã tham chiếu `vnp_TxnRef`, hạn thanh toán) và ký đúng; kiểm chữ ký, số tiền, mã cửa hàng của IPN trước khi ghi nhận; không mở hai giao dịch chưa rõ kết quả cho cùng một đơn; xử lý được khi cổng từ chối, đang bảo trì hoặc báo kết quả muộn |

Ghi chú:

- Khách hàng có hai trạng thái: **Guest** (chưa đăng nhập: xem menu, bỏ món vào giỏ) và **Customer** (đã đăng nhập: đặt đơn, thanh toán, xem lịch sử). SRS và các sơ đồ dùng thống nhất hai tên này.
- Mỗi yêu cầu trong [`srs.md`](srs.md) mục 5 và 6 đều ghi stakeholder hưởng lợi chính; bảng tổng hợp theo stakeholder nằm ở mục 7.

---

## 3. Phạm vi

### 3.1 Trong phạm vi MVP (in-scope)

MVP (bản nhỏ nhất chạy được) phủ đúng luồng của đề A2 §1.1. Mỗi bước gắn với một nhóm yêu cầu trong SRS.

| Bước luồng | Hệ thống làm gì | Yêu cầu chính |
|---|---|---|
| Xem menu | Hiện danh sách đồ uống (tên, giá, ảnh, còn hay hết), có màn chờ tải, màn trống và màn báo lỗi | FR-01, FR-02 |
| Chọn tùy chọn | Xem chi tiết món; chọn size (S/M/L) và topping; giá đổi theo lựa chọn | FR-03, FR-04 |
| Giỏ hàng | Thêm, sửa số lượng, xóa món; tự cộng tổng tiền; kiểm nguyên liệu dùng chung cho cả giỏ; giữ nguyên giỏ khi khách phải đăng nhập | FR-05, FR-06, FR-07 |
| Xác thực | Đăng ký, đăng nhập (JWT: chuỗi ký số chứng minh đã đăng nhập); chỉ người đã đăng nhập mới đặt được đơn | FR-08, FR-09, FR-10 |
| Đặt đơn | Tạo đơn `PENDING` trong một transaction (làm trọn hoặc không làm gì); máy chủ tính giá, cộng nhu cầu và giữ chỗ nguyên liệu | FR-11, FR-12, FR-13 |
| Quản lý kho | Barista nhập kho và kiểm kê nguyên liệu (phải ghi lý do), sửa công thức, xem mỗi món còn bán được bao nhiêu ly và nguyên liệu nào đang giới hạn | FR-29 |
| Thanh toán | Trả bằng ví/thẻ qua VNPay sandbox: khách được chuyển sang trang VNPay để trả, kết quả gửi về qua IPN hoặc QueryDR; thành công thì đơn thành `PAID`, thất bại thì `PAYMENT_FAILED`; không trừ tiền hai lần (Idempotency-Key, BR-10, BR-11) | FR-14, FR-15, FR-16 |
| Theo dõi đơn | Biên lai sau khi trả; lịch sử đơn; xem trạng thái từng đơn | FR-20, FR-21, FR-22 |

Quản lý trạng thái đơn (FR-23/24), chủ đơn hủy đơn chưa trả (FR-25) và quản lý nguyên liệu, công thức (FR-29) đều là **Must** (bắt buộc) của đợt BREW-INVENTORY-01. Hủy đơn chỉ trả lại phần nguyên liệu đang giữ chỗ theo bản chụp lúc đặt, không đụng tới số tồn thực tế; đơn đã trả tiền thì không hủy được.

Đi kèm là các yêu cầu phi chức năng (tốc độ, bảo mật, dễ dùng, triển khai): NFR-01 đến NFR-20.

Tóm lại cho người ngoài nhóm, hệ thống **làm được** những việc sau: khách chưa có tài khoản xem menu và bỏ món vào giỏ; khách có tài khoản đặt đơn, trả tiền qua VNPay sandbox và xem lại đơn; nhân viên quầy đổi trạng thái đơn qua API và quản lý nguyên liệu, công thức trên màn `/inventory`. Tình trạng production và CI/CD thực tế xem ở báo cáo triển khai, đừng suy ra từ tài liệu đặc tả này.

### 3.2 Phạm vi mở rộng

Các tính năng dưới đây xếp loại **Won't** (không làm trong bản nộp). Chỉ làm khi có PR được duyệt để mở rộng phạm vi, đồng thời cập nhật SRS, sơ đồ và ma trận truy vết:

- áp mã khuyến mãi: FR-17;
- ghi và hiển thị điểm thưởng: FR-18, FR-19 (FR-19 cần FR-18 làm trước);
- hủy đơn đã `PAID` và hoàn tiền: FR-26; chỉ trả lại điểm khi làm cả FR-18;
- API danh sách và màn hàng đợi cho Barista: FR-27.

Sơ đồ trạng thái (state machine) riêng ở Task 2 là tùy chọn, nhưng mô hình trạng thái và API FR-23/24 vẫn bắt buộc (FR-25 là Must). Bản tối thiểu chỉ có 8 lần chuyển trạng thái hợp lệ; chưa làm FR-26 thì không cho chuyển `PAID → CANCELLED`.

### 3.3 Ngoài phạm vi (out-of-scope)

Những việc **hệ thống không làm** trong Assignment 2:

| Hạng mục | Lý do | Mã Won't (SRS) |
|---|---|---|
| Màn quản trị menu (thêm, sửa, xóa món, giá, size, topping) | Đề A2 §7.1 không yêu cầu; menu nạp sẵn bằng seed (script dữ liệu mẫu). A1 gọi là UC13 | FR-28 |
| Màn quản trị voucher / khuyến mãi | Chỉ nạp mã bằng seed nếu làm FR-17. A1 gọi là UC15 | FR-30 |
| Cổng thanh toán thật (Momo, VNPay production, Stripe...) | Chỉ dùng VNPay sandbox, không thu tiền thật; số thẻ chỉ nhập trên trang VNPay, BrewLite không nhận và không lưu | FR-31 |
| Đổi / trừ điểm thưởng khi trả tiền | Ngay cả ghi và hiện điểm cũng nằm ngoài bản nộp (FR-18, FR-19) | FR-32 |
| Nhiều chi nhánh, giao hàng tận nơi, đặt trước giờ, thông báo đẩy | Nằm ngoài luồng của đề A2 §1.1 | không đánh mã |
| Vai trò Admin | Đề A2 chỉ có khách và nhân viên quầy; tài khoản Barista tạo sẵn bằng seed | không đánh mã |

> **Mô hình domain vẫn đủ lớp bắt buộc:** sơ đồ Task 2 vẫn có `Promotion` và `LoyaltyTransaction`, kèm thuộc tính, quan hệ và multiplicity (số lượng liên kết giữa hai lớp) theo đề A2 §4.3. Bản tối thiểu không cần seed khuyến mãi hay ghi điểm lúc thanh toán; phần chạy thật chỉ thêm khi làm FR-17/18. Hai lớp này vẫn nằm trong mô hình dù chức năng và API quản trị nằm ngoài bản nộp.

---

## 4. Giả định

| # | Giả định | Hệ quả nếu sai |
|---|---|---|
| A-01 | Trả bằng ví/thẻ đi qua **VNPay sandbox** (hệ thống ngoài, ADR-007): khách trả trên trang VNPay bằng thẻ test, kết quả gửi về qua IPN hoặc QueryDR; không thu tiền thật, BrewLite không nhận và không lưu số thẻ. Nhóm đã đăng ký sandbox và giữ `VNP_TMN_CODE`, `VNP_HASH_SECRET` bên ngoài repo (SRS mục 3.4) | Sandbox không chạy lúc demo thì không trả được đơn mới. Muốn chuyển sang cổng thật phải ký hợp đồng với VNPay và rà soát bảo mật, nằm ngoài phạm vi bài |
| A-02 | Một cửa hàng, một loại tiền là **VND**, giá là số nguyên đồng, không có số lẻ | Phải đổi kiểu dữ liệu giá nếu muốn hỗ trợ nhiều loại tiền |
| A-03 | Khách đăng ký bằng email và mật khẩu; không xác minh email, chưa có chức năng quên mật khẩu | Thêm luồng gửi email nếu Product Owner yêu cầu |
| A-04 | Tài khoản Barista tạo sẵn bằng seed; nhân viên không có màn tự đăng ký | Cần màn quản trị tài khoản nếu muốn tự tạo |
| A-05 | Menu, size (S/M/L), topping nạp bằng seed; mã khuyến mãi chỉ nạp khi làm FR-17; chạy seed một lần là dựng lại được dữ liệu | Đổi menu thì phải sửa seed và triển khai lại |
| A-06 | Số ly còn bán được tính từ công thức theo size/topping và lượng nguyên liệu còn dùng được (`available = onHand - reserved`: tồn thực tế trừ phần đang giữ cho các đơn khác); nước và đá coi như không giới hạn. Espresso pha sẵn, phin, cold brew đã lọc và trân châu đã nấu được xem là nguyên liệu bán thành phẩm, đếm riêng | Việc nấu mẻ từ nguyên liệu thô, hao hụt, nhà cung cấp và giá vốn nằm ngoài phạm vi |
| A-07 | Đơn mới giữ chỗ nguyên liệu (`reserved`) ngay khi tạo; trả thành công thì trừ cả tồn thực tế (`onHand`) lẫn phần giữ chỗ; hủy khi chưa trả thì chỉ nhả phần giữ chỗ. Mọi phép trừ đều theo bản chụp nguyên liệu lưu lúc đặt đơn (snapshot, không đổi về sau). Đơn tạo trước khi có kho nguyên liệu (cờ `inventoryTracked = false`) vẫn trừ theo cột `Product.stock` như cũ | Không suy số nguyên liệu từ số ly cũ; phải kiểm kê thực tế trước khi chuyển sang cách tính mới |
| A-08 | Giỏ hàng lưu trên trình duyệt; chỉ lúc đặt đơn mới gửi lên máy chủ | Muốn giỏ đi theo tài khoản thì phải thêm bảng giỏ hàng |
| A-09 | Người dùng có mạng ổn định; PWA chỉ có web app manifest (NFR-10), không có service worker nên không đặt đơn được khi mất mạng | Đặt đơn offline nằm ngoài phạm vi |
| A-10 | Môi trường demo và nghiệm thu dùng hạ tầng miễn phí; dịch vụ có thể "ngủ" nên lần gọi đầu tiên chậm | Xem rủi ro R-03, R-04 |
| A-11 | Quy mô nhỏ: tối đa vài chục món và vài chục người dùng cùng lúc | Lớn hơn thì cần tối ưu và đo lại |

---

## 5. Ràng buộc

| # | Loại | Ràng buộc | Nguồn |
|---|---|---|---|
| C-01 | Công nghệ | Frontend **Next.js** (ưu tiên điện thoại, PWA), backend **NestJS**, cơ sở dữ liệu **PostgreSQL**; không được thay ba thành phần này. Docker dùng cho `docker-compose.yml` và image | đề A2 §1.1, trang bìa |
| C-02 | Công nghệ | Được dùng thêm công nghệ khác (ORM, thư viện test, GitHub Actions...), chốt lại bằng ADR ở Task 3 | đề A2 §1.1 |
| C-03 | Quy trình | Năm task làm **lần lượt**; task sau chỉ được nghiệm thu khi tài liệu bắt buộc của task trước đã có trên repo, kèm lịch sử thay đổi rõ ràng | đề A2 §1 |
| C-04 | Truy vết | Thiếu tài liệu bắt buộc của task trước thì chuỗi truy vết bị đứt và task sau không được nghiệm thu phần truy vết | đề A2 §8.1 |
| C-05 | Tài liệu | Mỗi sơ đồ lưu cả file nguồn `.puml` và ảnh `.svg`; mọi thay đổi yêu cầu đều đi qua commit/PR có ghi lý do | đề A2 §4.2, §6.2 |
| C-06 | Mô hình | Class diagram có ít nhất 7 lớp: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` | đề A2 §4.3 |
| C-07 | Triển khai | Có CI khi mở PR (Install → Lint → Unit Test → Build) và CD (Push/Tag → Lint và Test → Build Docker Image → Push Registry → Deploy → Smoke Test); production chạy HTTPS, cơ sở dữ liệu không mở ra Internet, secret không nằm trong repo hay log CI | đề A2 §6.4, §7.3, §7.4 |
| C-08 | Hạ tầng (đã chốt 2026-10-21, ghi ở ADR 004) | Web chạy trên **Vercel**; API (container, image lấy từ GHCR) và PostgreSQL chạy trên **Render**, nối nhau bằng địa chỉ nội bộ; không dùng VPS. Gói miễn phí có giới hạn: dịch vụ ngủ khi không dùng và cơ sở dữ liệu có hạn sử dụng | kế hoạch A2 mục E; quyết định P1 trong `docs/planning/handoff/2026-10-21-req-sync/README.md` |
| C-10 | Thời gian | Hai Sprint cho Task 4 và Task 5; mốc ngày: **(nhóm điền)** | đề A2 §6, §7 |

---

## 6. Rủi ro ban đầu

Mức độ: C = cao, TB = trung bình, T = thấp. Đây là đánh giá sơ bộ theo khả năng xảy ra × mức ảnh hưởng; nhóm xem lại ở mỗi buổi Sprint Planning.

| # | Rủi ro | Mức | Ảnh hưởng | Cách giảm |
|---|---|---|---|---|
| R-02 | Thiếu tài liệu của task trước nên chuỗi truy vết bị đứt | C | Task sau không được nghiệm thu phần truy vết (đề A2 §8.1) | Có bước nghiệm thu giữa các task; cập nhật ma trận truy vết trong mọi PR |
| R-03 | Link production không chạy lúc nghiệm thu (cơ sở dữ liệu miễn phí hết hạn, dịch vụ đang ngủ) | C | Phần triển khai Task 5 không được tính (đề A2 §8.1) | Kiểm tra mỗi ngày trong tuần nghiệm thu; có seed để dựng lại cơ sở dữ liệu; "đánh thức" dịch vụ trước buổi nghiệm thu |
| R-04 | Smoke test báo lỗi giả vì dịch vụ miễn phí đang ngủ | TB | Pipeline CD báo đỏ dù code không lỗi | Smoke test thử lại trong khoảng 2 phút |
| R-05 | Yêu cầu mơ hồ, tiêu chí không đo được nên khó viết test | TB | Test không bám yêu cầu, truy vết bị đứt | Mỗi yêu cầu có tiêu chí đo được (mã HTTP, trạng thái, thời gian); nhóm soát lại ở PR Task 1 |
| R-06 | Sơ đồ Task 2 nói khác SRS (tên lớp, trạng thái, mã lỗi) | TB | Task 2 không đạt tiêu chí nghiệm thu (đề A2 §4.3) | Dùng đúng tên trong SRS mục 3; có bảng đối chiếu chéo ở PR Task 2 |
| R-07 | Không đủ thời gian cho Sprint 2 (nhiều việc nhất) | C | Không xong luồng từ đầu tới cuối | Giữ đúng phạm vi tối thiểu đã chốt, không đưa FR-17/18/19/26/27 vào bản nộp, FR-25/29 là Must của đợt kho; làm hạ tầng sớm |
| R-08 | Bán quá số tồn hoặc trừ tiền hai lần do xử lý đồng thời sai | TB | Sai nghiệp vụ cốt lõi | Đặt đơn trong transaction, khóa lạc quan hoặc cập nhật có điều kiện, Idempotency-Key; có test chạy đồng thời (NFR-13, FR-16) |
| R-09 | Lộ secret trong repo hoặc log CI | TB | Sự cố bảo mật, vi phạm yêu cầu bảo mật của đề A2 §7.4 | `.env` nằm trong `.gitignore`; không `echo` biến bí mật; soát `git log -p` và log CI trước khi nộp |
| R-10 | Chép sơ đồ hoặc code từ A1 thay vì thiết kế lại | TB | Lệch phạm vi A2 | A1 chỉ để tham khảo; viết lại theo phạm vi A2 (kế hoạch A2 mục D) |
| R-11 | Không bật được branch protection trên repo private gói miễn phí | TB | Không chứng minh được "CI đỏ thì PR không merge được" (đề A2 §6.4) | Kiểm tra sớm ở Task 4.1; dùng repo public hoặc organization có hỗ trợ |
| R-12 | Điều khoản gói miễn phí (Vercel, Render) thay đổi | T | Kế hoạch triển khai lệch thực tế | Đọc điều khoản khi chốt ADR 004 và ghi ngày kiểm tra |
| R-13 | Render miễn phí đang ngủ nên IPN của VNPay bị quá thời gian chờ | TB | Kết quả thanh toán về chậm; đơn vẫn `PENDING` dù khách đã trả | VNPay tự gọi lại IPN (tối đa 10 lần, cách nhau 5 phút). Khi khách mở lại trang kết quả, API chủ động hỏi VNPay bằng QueryDR rồi ghi kết quả qua cùng một hàm với IPN. Chưa có kết luận thì hiện "đang xác minh" và chưa cho trả lần hai, cho tới khi hết khoảng chờ 15 phút sau hạn thanh toán (D6, xem R-15) |
| R-14 | Sandbox VNPay bảo trì hoặc chậm đúng lúc demo/nghiệm thu; QueryDR của sandbox hiện trả `99` không kèm chữ ký cho mọi yêu cầu (spike 2026-10-30) | TB | Không tạo hoặc không xác nhận được thanh toán; demo luồng trả tiền bị hỏng; khi IPN không tới thì không còn nguồn thứ hai để xác nhận | Quay video luồng thanh toán từ trước; kiểm sandbox trước buổi nghiệm thu; demo trên Render (nơi IPN tới được), không trông vào QueryDR. Trong khoảng chờ, đơn đang xác minh vẫn giữ `PENDING`, không đoán là thất bại; hết khoảng chờ thì đóng theo D6 (R-15) |
| R-15 | Payment hết hạn hoặc khách bỏ dở trang VNPay nhưng đơn vẫn giữ nguyên liệu (chưa có job tự hủy đơn) | TB | Nguyên liệu bị giữ tới khi đơn được trả hoặc khách tự hủy; tiền có thể về muộn sau khi payment đã đóng | Hạn thanh toán 15 phút chỉ đánh dấu payment cần đối soát, không tự hủy đơn và không tự nhả kho. Trước khi tạo giao dịch mới hoặc hủy đơn, API đối soát bằng QueryDR theo SRS. Nếu đã quá `expiresAt + 15 phút` mà vẫn chưa có kết luận, lần gọi tạo thanh toán, hủy đơn hoặc `sync` kế tiếp sẽ đóng payment thành `FAILED` (`gatewayResponseCode = "EXPIRED"`), đơn chuyển `PAYMENT_FAILED`, kho giữ nguyên và ghi cảnh báo `PAYMENT_EXPIRED_UNCONFIRMED`; khách trả lại hoặc hủy đơn để nhả nguyên liệu (D6, BR-10, ADR-007). Các trạng thái đáng ngờ (`04`/`05`/`06`/`07`/`09`) và phản hồi `00` sai mã cửa hàng, mã tham chiếu hay số tiền thì không tự đóng. Nếu tiền về sau khi đơn đã ở trạng thái cuối, hệ thống ghi cảnh báo `PAYMENT_RECONCILIATION_REQUIRED` để nhân viên đối soát và hoàn tiền tay (`docs/deployment.md`) |
