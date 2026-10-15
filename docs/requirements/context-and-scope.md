# Bối cảnh, stakeholder và phạm vi (Task 1.1)

> **Baseline Task 1 theo phạm vi minimum đã chốt trong PR #5.** Thành viên phụ trách phải tự giải thích được từng mục khi vấn đáp.
>
> Đáp ứng đề A2 §3.1. Đề A2: [`../Assignment2-BrewLite.md`](../Assignment2-BrewLite.md). Bối cảnh từ đề A1 (chỉ tham khảo): [`../BrewLite-CongNghePhanMem-fixed.md`](../BrewLite-CongNghePhanMem-fixed.md) §3. Tài liệu đi kèm: [`srs.md`](srs.md), [`uc-checkout.md`](uc-checkout.md), [`use-case-overview.svg`](use-case-overview.svg).
>
> Phạm vi bản nộp đã chốt tại SRS mục 1.4 và 8; lựa chọn triển khai/ADR thuộc các task sau.

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

Tại quán cà phê, khách thường phải **xếp hàng để gọi món và trả tiền mặt**. Giờ cao điểm hàng dài, nhân viên vừa nhận order vừa thối tiền nên dễ sai món, sai tiền; khách không biết đơn của mình đã được pha tới đâu.

**BrewLite** là ứng dụng web mobile-first (PWA) cho phép khách **tự chọn đồ uống, chọn size/topping, đặt đơn và thanh toán không dùng tiền mặt** chỉ với vài chạm, rồi **theo dõi trạng thái đơn** cho tới khi nhận nước. Product Vision (đề A1 §3.1): giúp khách đặt và thanh toán đồ uống không dùng tiền mặt, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.

Hệ thống phải giải quyết bốn việc:

- **Gọi món đúng:** khách thấy menu, giá, tùy chọn trước khi đặt; máy chủ tự tính giá nên không sai tiền.
- **Trả tiền không tiền mặt an toàn:** thanh toán Ví/Thẻ (mô phỏng), không bị trừ tiền hai lần khi gửi lại yêu cầu.
- **Không bán quá số lượng còn:** tồn kho được kiểm và trừ trong transaction khi đặt đơn.
- **Minh bạch trạng thái đơn:** đơn đi qua các trạng thái `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`; khách xem lại được trong lịch sử.

Luồng nghiệp vụ tối thiểu (đề A2 §1.1): **Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn**.

---

## 2. Stakeholder: mục tiêu và kỳ vọng

Sáu bên theo đề A2 §3.1 (mô tả gốc: đề A1 §3.2).

| # | Stakeholder | Vai trò với hệ thống | Mục tiêu | Kỳ vọng |
|---|---|---|---|---|
| S1 | Khách hàng | Người dùng cuối, đặt và trả tiền cho đồ uống | Đặt đồ uống nhanh, không xếp hàng, không cần tiền mặt, biết đơn đang ở đâu | Menu rõ giá; chọn size/topping dễ; tổng tiền đúng và thấy trước khi trả; thanh toán lỗi thì không mất tiền và giữ lại giỏ; xem lại được lịch sử đơn; dùng tốt trên điện thoại |
| S2 | Nhân viên quầy (Barista) | Nhận đơn đã trả tiền và pha chế | Biết đơn nào cần làm, báo tiến độ chính xác, không nhầm đơn chưa thanh toán | Đọc đơn theo mã từ biên lai demo; chỉ chuyển sang pha chế với đơn đã `PAID`; đổi trạng thái theo đúng thứ tự `PAID → PREPARING → READY → COMPLETED`; không thể đổi sai trạng thái. Trong MVP, vai trò này làm qua API (Postman), chưa có màn quầy riêng (xem mục 3.2) |
| S3 | Quản lý cửa hàng (Product Owner) | Đặt yêu cầu, ưu tiên backlog, nghiệm thu từng Increment | Tăng số đơn thanh toán không tiền mặt, giảm thời gian xếp hàng, có dữ liệu đơn đáng tin | Phạm vi MVP rõ, bàn giao đúng hạn; số liệu đơn và thanh toán không sai lệch; khuyến mãi và điểm thưởng được mô hình hóa để mở rộng sau; có thể mở rộng sau (quản trị menu, kho, voucher) |
| S4 | Giảng viên / khách hàng nghiệm thu | Chấm bài, đánh giá quy trình và sản phẩm | Kiểm chứng nhóm làm đúng chuỗi yêu cầu → thiết kế → code → CI/CD → production | Tạo phẩm đủ và nhất quán (SRS, sơ đồ, ADR, ma trận truy vết); lịch sử commit/PR rõ; URL production sống lúc chấm; nhóm giải thích được từng tạo phẩm, không vibecoding |
| S5 | Nhóm phát triển | Phân tích, thiết kế, lập trình, kiểm thử, triển khai | Giao hệ thống chạy được, đạt tiêu chí chấp nhận, đúng hạn từng task | Yêu cầu rõ và kiểm chứng được để viết test; phạm vi vừa sức hai Sprint; công cụ miễn phí chạy ổn; không bị đổi yêu cầu giữa chừng nếu không qua PR |
| S6 | Đơn vị thanh toán (Payment Service) | Cổng Ví/Thẻ; trong bài là dịch vụ **mô phỏng** | Nhận yêu cầu trừ tiền hợp lệ, trả kết quả thành công/thất bại rõ ràng | Hệ thống gọi đúng giao diện (số tiền, phương thức, mã tham chiếu); không gọi trùng cho cùng một giao dịch; xử lý được khi cổng báo lỗi hoặc không phản hồi |

Ghi chú:

- Khách hàng chia hai trạng thái truy cập: **Guest** (chưa đăng nhập: xem menu, giỏ hàng) và **Customer** (đã đăng nhập: đặt đơn, thanh toán, lịch sử). Hai tên này dùng xuyên suốt SRS và sơ đồ.
- Mỗi yêu cầu trong [`srs.md`](srs.md) mục 5 và 6 ghi stakeholder có lợi ích chính; bảng tổng hợp theo stakeholder ở mục 7.

---

## 3. Phạm vi

### 3.1 Trong phạm vi MVP (in-scope)

MVP phủ đúng luồng của đề A2 §1.1. Mỗi bước gắn với nhóm yêu cầu trong SRS.

| Bước luồng | Hệ thống làm gì | Yêu cầu chính |
|---|---|---|
| Xem menu | Danh sách đồ uống (tên, giá, ảnh, tình trạng còn hàng) với loading/empty/error | FR-01, FR-02 |
| Chọn tùy chọn | Chi tiết sản phẩm; chọn size (S/M/L) và topping; giá cập nhật theo lựa chọn | FR-03, FR-04 |
| Giỏ hàng | Thêm, sửa số lượng, xóa; tự tính tổng tiền; giữ giỏ khi cần đăng nhập | FR-05, FR-06, FR-07 |
| Xác thực | Đăng ký, đăng nhập, JWT; bảo vệ chức năng đặt đơn | FR-08, FR-09, FR-10 |
| Đặt đơn | Tạo đơn `PENDING` trong transaction, server tính giá, kiểm và trừ tồn kho | FR-11, FR-12, FR-13 |
| Thanh toán | Ví/Thẻ mô phỏng; thành công `PAID`, thất bại `PAYMENT_FAILED`; chống trừ tiền hai lần (Idempotency-Key) | FR-14, FR-15, FR-16 |
| Theo dõi đơn | Biên lai sau khi trả; lịch sử đơn; xem trạng thái một đơn | FR-20, FR-21, FR-22 |

Quản lý trạng thái đơn là **Must** trong minimum: state machine (FR-23), Barista đổi trạng thái qua API/Postman (FR-24), khách hủy đơn chưa trả và hoàn tồn kho (FR-25). Không cần màn hàng đợi để thực hiện API theo mã đơn.

Kèm các yêu cầu phi chức năng (hiệu năng, bảo mật, tính khả dụng, triển khai): NFR-01 đến NFR-20.

Hệ thống **làm được** (tóm tắt cho người đọc ngoài nhóm): khách chưa có tài khoản xem menu và gom giỏ; khách có tài khoản đặt đơn, trả tiền mô phỏng và xem lại đơn; nhân viên quầy đổi trạng thái đơn qua API; hệ thống chạy trên production có URL HTTPS, có CI/CD.

### 3.2 Phạm vi mở rộng

Các tính năng sau **ngoài bản nộp (Won’t)**; chỉ triển khai khi có PR phê duyệt thay đổi phạm vi, đồng bộ SRS, sơ đồ và truy vết:

- áp mã khuyến mãi: FR-17;
- ghi nhận và hiển thị điểm thưởng: FR-18, FR-19 (FR-19 phụ thuộc FR-18);
- hủy đơn đã PAID và hoàn tiền: FR-26; đảo điểm chỉ khi triển khai cả FR-18;
- API danh sách và màn hàng đợi Barista: FR-27.

Sơ đồ state machine riêng ở Task 2 là tùy chọn; mô hình trạng thái và API FR-23/24/25 vẫn bắt buộc. Minimum chỉ có 8 chuyển trạng thái hợp lệ, không cho PAID → CANCELLED khi chưa triển khai FR-26.

### 3.3 Ngoài phạm vi (out-of-scope)

Những việc **hệ thống không làm** trong Assignment 2:

| Hạng mục | Lý do | Mã Won't (SRS) |
|---|---|---|
| Màn hình quản trị menu (CRUD món, giá, size, topping) | Đề A2 §7.1 không đòi; dữ liệu menu nạp bằng seed. A1 gọi là UC13 | FR-28 |
| Màn hình quản trị kho / chỉnh tồn kho | Tồn kho đổi qua seed và qua luồng đặt/hủy đơn. A1 gọi là UC14 | FR-29 |
| Màn hình quản trị voucher / khuyến mãi | Chỉ seed mã khi triển khai FR-17. A1 gọi là UC15 | FR-30 |
| Thanh toán thật (Momo, VNPay, Stripe...) | Chỉ dùng dịch vụ mô phỏng, không xử lý thông tin thẻ thật | FR-31 |
| Đổi / trừ điểm thưởng khi thanh toán | Ghi nhận và hiển thị điểm cũng ngoài bản nộp (FR-18, FR-19) | FR-32 |
| Nhiều chi nhánh, giao hàng tận nơi, đặt trước giờ, thông báo đẩy | Ngoài luồng đề A2 §1.1 | không đánh mã |
| Vai trò Admin | Đề A2 chỉ có khách và nhân viên quầy; tài khoản Barista do seed tạo | không đánh mã |

> **Mô hình domain bắt buộc:** Task 2 vẫn có `Promotion` và `LoyaltyTransaction` với thuộc tính, quan hệ và multiplicity theo đề A2 §4.3. Minimum không yêu cầu seed khuyến mãi hoặc ghi giao dịch điểm lúc thanh toán; phần runtime chỉ thêm khi triển khai FR-17/18. Hai lớp vẫn nằm trong mô hình dù chức năng và API quản trị nằm ngoài bản nộp.

---

## 4. Giả định

| # | Giả định | Hệ quả nếu sai |
|---|---|---|
| A-01 | Thanh toán Ví/Thẻ là **mô phỏng**: dịch vụ giả lập trả thành công hoặc thất bại theo quy ước test (SRS mục 3); không thu tiền thật | Nếu dùng cổng thật phải thêm bảo mật PCI, ngoài phạm vi |
| A-02 | Một cửa hàng, một đơn vị tiền tệ **VND**, giá là số nguyên đồng, không có phần thập phân | Phải đổi kiểu dữ liệu giá nếu hỗ trợ nhiều tiền tệ |
| A-03 | Khách đăng ký bằng email và mật khẩu; không xác minh email, không quên mật khẩu | Thêm luồng email nếu PO yêu cầu |
| A-04 | Tài khoản Barista do seed tạo sẵn; không có màn đăng ký cho nhân viên | Cần màn quản trị tài khoản nếu muốn tự tạo |
| A-05 | Menu, size (S/M/L), topping nạp bằng seed; mã khuyến mãi chỉ khi triển khai FR-17; một lần seed tái tạo được dữ liệu | Thay đổi menu phải sửa seed và triển khai lại |
| A-06 | Tồn kho tính theo **số ly** từng sản phẩm (cột tồn kho của `Product`), không theo nguyên liệu | Nếu theo nguyên liệu cần thêm mô hình công thức |
| A-07 | Tồn kho được **giữ chỗ khi tạo đơn** và hoàn lại khi đơn `CANCELLED` (đã chốt; SRS mục 8.1) | Nếu trừ lúc thanh toán thì sequence và FR-13 phải đổi |
| A-08 | Giỏ hàng lưu ở trình duyệt (phía client); chỉ khi đặt đơn mới gửi lên server | Nếu cần giỏ theo tài khoản phải thêm bảng giỏ |
| A-09 | Người dùng có kết nối mạng ổn định; PWA chỉ cài được và hiển thị khung, chưa hỗ trợ đặt đơn offline | Đặt đơn offline là ngoài phạm vi |
| A-10 | Môi trường demo/chấm dùng hạ tầng miễn phí; dịch vụ có thể "ngủ" và phản hồi đầu tiên chậm | Xem rủi ro R-03, R-04 |
| A-11 | Quy mô nhỏ: tối đa vài chục sản phẩm và vài chục người dùng đồng thời | Cần tối ưu và đo lại nếu lớn hơn |

---

## 5. Ràng buộc

| # | Loại | Ràng buộc | Nguồn |
|---|---|---|---|
| C-01 | Công nghệ | Frontend **Next.js** (mobile-first/PWA), backend **NestJS**, CSDL **PostgreSQL**; không được thay thế ba thành phần này. Docker dùng cho `docker-compose.yml` và image | đề A2 §1.1, trang bìa |
| C-02 | Công nghệ | Được bổ sung công nghệ khác (ORM, thư viện test, GitHub Actions...), chốt bằng ADR ở Task 3 | đề A2 §1.1 |
| C-03 | Quy trình | Năm task làm **tuần tự**; task sau chỉ nghiệm thu khi tạo phẩm bắt buộc của task trước đã có trên repo với lịch sử thay đổi rõ ràng | đề A2 §1 |
| C-04 | Truy vết | Thiếu tạo phẩm bắt buộc của task trước thì task sau không được tính điểm truy vết | đề A2 §8.1 |
| C-05 | Tài liệu | Mỗi sơ đồ lưu cả nguồn `.puml` và ảnh `.svg`; mọi thay đổi yêu cầu qua commit/PR kèm lý do | đề A2 §4.2, §6.2 |
| C-06 | Mô hình | Class diagram tối thiểu 7 lớp: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` | đề A2 §4.3 |
| C-07 | Triển khai | Có CI khi mở PR (Install → Lint → Unit Test → Build), CD (Push/Tag → Lint và Test → Build Docker Image → Push Registry → Deploy → Smoke Test), production qua HTTPS, DB không public, secret không nằm trong repo hoặc log CI | đề A2 §6.4, §7.3, §7.4 |
| C-08 | Hạ tầng (đề xuất, nhóm chốt bằng ADR 004) | Web trên **Vercel**; API (container, image từ GHCR) và PostgreSQL trên **Render**; free tier có giới hạn ngủ đông và hết hạn DB | kế hoạch A2 mục E |
| C-09 | Nhân lực | Code Task 4–5 do nhóm tự viết; tài liệu Task 1–3 có thể nhờ agent soạn nháp rồi nhóm sửa, chốt; mọi người phải giải thích được tạo phẩm của mình | kế hoạch A2 mục A.4 |
| C-10 | Thời gian | Hai Sprint cho Task 4 và Task 5; mốc ngày: **(nhóm điền)** | đề A2 §6, §7 |

---

## 6. Rủi ro ban đầu

Mức: C = cao, TB = trung bình, T = thấp. Xác suất × ảnh hưởng đánh giá sơ bộ, nhóm rà lại ở mỗi Sprint Planning.

| # | Rủi ro | Mức | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|---|
| R-01 | Không giải thích được tạo phẩm khi vấn đáp (nghi vibecoding) | C | Mất điểm, mất uy tín | Mỗi người tự đọc và sửa phần mình; ghi người phụ trách trong PR; luyện giải thích trước Sprint Review |
| R-02 | Thiếu tạo phẩm task trước làm mất điểm truy vết | C | Mất điểm truy vết (đề A2 §8.1) | Cổng nghiệm thu giữa các task; cập nhật ma trận truy vết trong mỗi PR |
| R-03 | URL production không sống lúc chấm (DB free hết hạn, dịch vụ ngủ) | C | Task 5 triển khai không được tính (đề A2 §8.1) | Kiểm tra hằng ngày tuần chấm; có seed dựng lại DB; "đánh thức" dịch vụ trước buổi chấm |
| R-04 | Smoke test hỏng giả vì dịch vụ free ngủ đông | TB | Pipeline CD đỏ không do lỗi code | Smoke test có retry khoảng 2 phút |
| R-05 | Yêu cầu mơ hồ, tiêu chí không đo được nên khó viết test | TB | Test không bám yêu cầu, truy vết đứt | Mỗi yêu cầu có tiêu chí chấp nhận đo được (mã HTTP, trạng thái, thời gian); nhóm rà ở PR Task 1 |
| R-06 | Sơ đồ Task 2 mâu thuẫn SRS (tên lớp, trạng thái, mã lỗi) | TB | Mất điểm Task 2 (đề A2 §4.3) | Dùng đúng tên ở SRS mục 3; bảng kiểm chéo ở PR Task 2 |
| R-07 | Thiếu thời gian cho Sprint 2 (nhiều hạng mục nhất) | C | Không xong luồng end-to-end | Giữ minimum đã chốt, không đưa FR-17/18/19/26/27 vào bản nộp; làm hạ tầng sớm |
| R-08 | Bán vượt tồn kho hoặc trừ tiền hai lần do xử lý đồng thời sai | TB | Sai nghiệp vụ cốt lõi | Transaction khi đặt đơn, khóa lạc quan hoặc cập nhật có điều kiện, Idempotency-Key; có test đồng thời (NFR-13, FR-16) |
| R-09 | Lộ secret trong repo hoặc log CI | TB | Sự cố bảo mật, mất điểm (đề A2 §7.4) | `.env` nằm trong `.gitignore`; không `echo` biến; rà `git log -p` và log CI trước khi nộp |
| R-10 | Sao chép sơ đồ/code từ A1 thay vì thiết kế lại | TB | Lệch phạm vi A2, nghi đạo văn | A1 chỉ tham khảo; viết lại theo phạm vi A2 (kế hoạch A2 mục D) |
| R-11 | Branch protection không bật được trên repo private gói free | TB | Không chứng minh được "PR không merge khi CI đỏ" (đề A2 §6.4) | Kiểm tra sớm ở Task 4.1; dùng repo public hoặc organization hỗ trợ |
| R-12 | Điều khoản free tier (Vercel, Render) thay đổi | T | Kế hoạch triển khai lệch thực tế | Đọc điều khoản khi chốt ADR 004 và ghi ngày kiểm tra |
