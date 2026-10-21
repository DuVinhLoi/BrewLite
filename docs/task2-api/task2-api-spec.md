# Task 2 – API danh sách sản phẩm

## Mục tiêu

API này phục vụ màn hình menu của ứng dụng BrewLite. Backend NestJS trả về danh sách sản phẩm hiện có dưới dạng JSON để frontend hiển thị menu.

## Endpoint

### GET /products

- Method: `GET`
- Route: `/products`
- Mô tả: Trả về danh sách sản phẩm đang có sẵn để khách hàng chọn.

## Response thành công

Status: `200 OK`

```json
[
  {
    "id": "1",
    "name": "Cà phê đen",
    "price": 29000,
    "image": "https://example.com/images/black-coffee.jpg"
  },
  {
    "id": "2",
    "name": "Cappuccino",
    "price": 39000,
    "image": "https://example.com/images/cappuccino.jpg"
  },
  {
    "id": "3",
    "name": "Latte",
    "price": 45000,
    "image": "https://example.com/images/latte.jpg"
  }
]
```

## Dữ liệu trả về

Mỗi sản phẩm bao gồm:

- `id`: mã sản phẩm
- `name`: tên sản phẩm
- `price`: giá tiền
- `image`: đường dẫn hình ảnh

## Điều kiện hiển thị

- Chỉ trả về các sản phẩm còn hàng hoặc đang có sẵn để bán.
- Nếu không có sản phẩm nào, có thể trả về `[]`.
- Dữ liệu có thể lấy từ mock data hoặc từ cơ sở dữ liệu PostgreSQL.

## Lỗi

### 400 Bad Request

Dùng khi request không hợp lệ hoặc sai định dạng.

### 500 Internal Server Error

Dùng khi lỗi server hoặc lỗi kết nối CSDL.

## Ghi chú kỹ thuật

- Backend: NestJS
- Database: PostgreSQL
- Dữ liệu sản phẩm có thể lưu trong bảng `Product`
- API này là đầu vào cho màn hình menu, giúp người dùng chọn món trước khi thêm vào giỏ hàng.
