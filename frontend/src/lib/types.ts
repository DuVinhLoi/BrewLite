// Task 3 + Task 5 shared types.
// Khớp với backend contract (nhánh feature/task-8-10-payment-order):
// - ProductDto { id, name, price, stock, version } + Prisma Product { imageUrl }
// - OrderItemDto { productId, quantity, unitPrice } + Prisma OrderItem { size, qty, lineTotal }
// - CartItem (docs UC02): { productId, name, size, toppings, quantity, unitPrice, lineTotal }

export type Size = 'S' | 'M' | 'L';

export interface Product {
  id: string;
  name: string;
  /** Giá gốc (VND, số nguyên) — tương ứng size S, chưa cộng size/topping. */
  price: number;
  imageUrl?: string;
  stock: number;
  /** Optimistic-locking version (backend Task 10). Frontend không tự tăng, chỉ hiển thị/kiểm tra hết hàng. */
  version?: number;
}

export interface CartItem {
  /** Khóa dòng giỏ = productId + size + toppings (đã sort). Tránh gộp nhầm 2 option khác nhau. */
  key: string;
  productId: string;
  name: string;
  imageUrl?: string;
  size: Size;
  toppings: string[];
  quantity: number;
  /** Đơn giá đã gồm size/topping (VND). Tính bởi calcUnitPrice — NGUỒN DUY NHẤT, tránh sai số với backend. */
  unitPrice: number;
  /** = unitPrice * quantity. Luôn tính lại, không lưu tay. */
  lineTotal: number;
}
