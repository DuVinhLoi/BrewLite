# Task 2 – API danh sách sản phẩm

## Mục tiêu

Cung cấp API cho màn hình menu của ứng dụng BrewLite. API trả về danh sách sản phẩm đang còn hàng để frontend hiển thị trên màn hình menu.

## Endpoint

### GET /products

- Method: `GET`
- Route: `/products`
- Mô tả: Trả về danh sách các sản phẩm hiện có để khách hàng chọn.

## Response thành công

Status: `200 OK`

```json
[
  {
    "id": "prod_001",
    "name": "Cà phê đen",
    "price": 29000,
    "image": "https://example.com/images/black-coffee.jpg"
  },
  {
    "id": "prod_002",
    "name": "Cappuccino",
    "price": 39000,
    "image": "https://example.com/images/cappuccino.jpg"
  },
  {
    "id": "prod_003",
    "name": "Latte",
    "price": 45000,
    "image": "https://example.com/images/latte.jpg"
  }
]
```

## Cấu trúc dữ liệu

Mỗi phần tử trong danh sách chứa các trường:

- `id`: mã sản phẩm
- `name`: tên sản phẩm
- `price`: giá sản phẩm (đơn vị VND)
- `image`: URL ảnh sản phẩm

## Điều kiện trả về

- Chỉ trả về các sản phẩm có sẵn để bán.
- Nếu không có sản phẩm nào, trả về `[]`.
- Nếu dữ liệu được lưu trong database, nên lọc `stock > 0`.

## Error handling

### 400 Bad Request

Dùng khi request sai định dạng hoặc dữ liệu không hợp lệ.

### 500 Internal Server Error

Dùng khi lỗi server hoặc lỗi kết nối cơ sở dữ liệu.

## Ghi chú kỹ thuật

- Backend: NestJS
- Database: PostgreSQL
- Dữ liệu lưu trong bảng `Product`
- API này dùng cho màn hình menu và là đầu vào cho các chức năng tiếp theo như chọn size, topping, giỏ hàng và đặt đơn.
