# Task 9 – Xác nhận đơn hàng và lịch sử đơn hàng

## Mục tiêu

Sau khi khách hàng đặt đơn thành công, hệ thống cần hiển thị màn hình xác nhận đơn và cho phép người dùng xem lịch sử đơn hàng của chính mình.

## 1. Màn hình xác nhận đơn

### Mục đích

Màn hình này giúp người dùng kiểm tra thông tin đơn sau khi thanh toán hoặc đặt hàng thành công.

### Thông tin hiển thị

- mã đơn hàng,
- trạng thái đơn hàng,
- tổng tiền,
- thời gian đặt,
- phương thức thanh toán,
- danh sách món đã đặt.

### Ví dụ JSON xác nhận đơn

```json
{
  "orderId": "ORD_20261021_0001",
  "status": "PAID",
  "total": 89000,
  "paymentMethod": "CARD",
  "createdAt": "2026-10-21T09:30:00Z"
}
```

## 2. Endpoint: GET /orders/me

### Mục tiêu

Trả về danh sách đơn hàng của người dùng đang đăng nhập.

### Endpoint

- Method: `GET`
- Route: `/orders/me`

### Response thành công

Status: `200 OK`

```json
[
  {
    "id": "ORD_20261021_0001",
    "status": "PAID",
    "total": 89000,
    "createdAt": "2026-10-21T09:30:00Z"
  },
  {
    "id": "ORD_20261021_0002",
    "status": "PENDING",
    "total": 52000,
    "createdAt": "2026-10-21T10:15:00Z"
  }
]
```

## 3. Luồng nghiệp vụ

1. Khách hàng xem menu.
2. Chọn sản phẩm và thêm vào giỏ hàng.
3. Gửi yêu cầu đặt đơn.
4. Hệ thống tạo đơn hàng.
5. Khách hàng thanh toán.
6. Hệ thống cập nhật trạng thái đơn hàng.
7. Khách hàng xem xác nhận đơn và lịch sử đơn hàng.

## 4. Trạng thái đơn hàng gợi ý

- `PENDING`: đơn vừa được tạo
- `PAID`: đã thanh toán
- `PREPARING`: đang pha chế
- `READY`: đã sẵn sàng giao/nhận
- `COMPLETED`: hoàn thành
- `PAYMENT_FAILED`: thanh toán thất bại
- `CANCELLED`: hủy đơn

## 5. Bảo mật

- Chỉ người dùng đã đăng nhập mới được xem đơn hàng của mình.
- Backend cần kiểm tra JWT token trước khi trả dữ liệu.
- Không cho phép truy cập đơn hàng của người dùng khác.

## 6. Cấu hình chạy local

### Docker Compose

```bash
docker compose up --build
```

Các service cần chạy:

- frontend
- backend
- db

## 7. Kết luận

Task 9 tập trung vào trải nghiệm sau khi đặt hàng: xác nhận đơn và lịch sử đơn hàng. Đây là phần quan trọng để khách hàng theo dõi trạng thái đơn và nắm rõ thông tin thanh toán.
