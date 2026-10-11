// ============================================================
// FEATURE: Shared types — khớp backend contract (ProductDto,
// OrderItemDto + Prisma Product/OrderItem).
// ============================================================

export type Size = 'S' | 'M' | 'L';

export interface Product {
  id: string;
  name: string;
  /** Giá gốc VND (số nguyên, size S) — cộng size/topping qua pricing.ts. */
  price: number;
  imageUrl?: string;
  stock: number;
  /** Optimistic-lock version: client chỉ đọc, backend Task 10 tự tăng. */
  version?: number;
}

/** Một dòng món của GET /orders/me; productName do backend gắn (món đã bị xóa thì bằng productId). */
export interface HistoryItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

/** Một đơn trong lịch sử (GET /orders/me, backend trả mới nhất trước). */
export interface HistoryOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: HistoryItem[];
}

/** Một đơn của GET /orders/:id (chủ đơn xem; biên lai poll trạng thái). Khác HistoryOrder: dòng món không có productName. */
export interface OrderDetail {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Omit<HistoryItem, 'productName'>[];
}

export interface CartItem {
  /** Khóa dòng giỏ = productId|size|toppings(sort): option khác nhau không gộp nhầm. */
  key: string;
  productId: string;
  name: string;
  imageUrl?: string;
  size: Size;
  toppings: string[];
  quantity: number;
  /** Đã gồm size/topping — tính bởi calcUnitPrice (nguồn duy nhất). */
  unitPrice: number;
  /** = unitPrice * quantity, luôn tính lại. */
  lineTotal: number;
}
