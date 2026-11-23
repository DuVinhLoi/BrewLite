# docs/requirements/use-cases — Đặc tả các use-case

Thư mục này chứa đặc tả của 7 use-case phụ. Cùng với UC-04 và UC-10 nằm ở thư mục cha, đây là đủ 9 use-case cấp cao trong [use-case tổng quát](../use-case-overview.svg) (nguồn: [`../use-case-overview.puml`](../use-case-overview.puml)).

Use-case trọng tâm theo đề A2 §3.3 là **UC-04 Đặt và thanh toán đơn hàng**, đặc tả ở [`../uc-checkout.md`](../uc-checkout.md). Các đặc tả ở đây bổ sung cho UC-04 và không chép lại nội dung của nó.

Nguồn sự thật của mọi đặc tả là [`../srs.md`](../srs.md): mã `FR-xx`, tiêu chí `AC-Fxx.y`, mã lỗi, tên trạng thái và endpoint đều lấy từ đó. Danh mục use-case và actor: SRS mục 2.3.

## Mục lục

| Mã | Use-case | Actor | Yêu cầu | Đặc tả | Sơ đồ |
|---|---|---|---|---|---|
| UC-01 | Xem menu và chi tiết món (size, topping) | Guest, Customer | FR-01 đến FR-04 | [`uc-01-menu.md`](uc-01-menu.md) | [`.puml`](uc-01-menu.puml), [`.svg`](uc-01-menu.svg) |
| UC-02 | Quản lý giỏ hàng | Guest, Customer | FR-05 đến FR-07 | [`uc-02-cart.md`](uc-02-cart.md) | [`.puml`](uc-02-cart.puml), [`.svg`](uc-02-cart.svg) |
| UC-03 | Đăng nhập (JWT) | Guest, Barista | FR-09, FR-10 | [`uc-03-login.md`](uc-03-login.md) | [`.puml`](uc-03-login.puml), [`.svg`](uc-03-login.svg) |
| UC-04 | **Đặt và thanh toán đơn hàng** (trọng tâm) | Customer; VNPay sandbox | FR-10 đến FR-16 | [`../uc-checkout.md`](../uc-checkout.md) | [`.puml`](../uc-checkout.puml), [`.svg`](../uc-checkout.svg) |
| UC-05 | Xem lịch sử và theo dõi đơn | Customer | FR-20, FR-21, FR-22 | [`uc-05-order-history.md`](uc-05-order-history.md) | [`.puml`](uc-05-order-history.puml), [`.svg`](uc-05-order-history.svg) |
| UC-06 | Hủy đơn chưa trả | Customer; VNPay sandbox (chỉ khi đối soát payment quá hạn) | FR-25 | [`uc-06-cancel-order.md`](uc-06-cancel-order.md) | [`.puml`](uc-06-cancel-order.puml), [`.svg`](uc-06-cancel-order.svg) |
| UC-07 | Cập nhật trạng thái đơn | Barista | FR-23, FR-24 | [`uc-07-order-status.md`](uc-07-order-status.md) | [`.puml`](uc-07-order-status.puml), [`.svg`](uc-07-order-status.svg) |
| UC-09 | Đăng ký tài khoản | Guest | FR-08 | [`uc-09-register.md`](uc-09-register.md) | [`.puml`](uc-09-register.puml), [`.svg`](uc-09-register.svg) |
| UC-10 | Quản lý nguyên liệu và công thức | Barista | FR-29 | [`../uc-inventory.md`](../uc-inventory.md) | không có sơ đồ riêng |

UC-08 (xem điểm thưởng, FR-19) là Won't trong bản nộp nên không có đặc tả.

## Cấu trúc một đặc tả

Mỗi file `.md` theo cùng khung với UC-04:

1. Tóm tắt
2. Use-case diagram
3. Actor
4. Trigger, tiền điều kiện, hậu điều kiện
5. Luồng chính
6. Luồng thay thế (mã `A1`, `A2`, …)
7. Luồng ngoại lệ (mã `E1`, `E2`, …)
8. Liên kết với yêu cầu

UC-06 và UC-07 có thêm mục 9 "Không làm trong bản nộp" cho FR-26 và FR-27.

## Sơ đồ

Mỗi sơ đồ lưu cả nguồn `.puml` và ảnh `.svg` (đề A2 §4.2). Nhãn use-case chỉ ghi mã và tên; mã yêu cầu nằm ở mục 8 của từng đặc tả. Ảnh xuất bằng PlantUML 1.2026.8, chạy từ gốc repo:

```bash
java -jar C:/path/to/plantuml.jar -charset UTF-8 -tsvg docs/requirements/use-cases/*.puml
```

Sửa `.puml` thì xuất lại `.svg` trong cùng commit.
