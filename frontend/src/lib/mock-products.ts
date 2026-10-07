// Dữ liệu mẫu fallback khi backend GET /products chưa chạy (Task 2).
// Bám đúng wireframe PDF Mục 7 + giá trong docs (Cappuccino 45.000đ).
// Khi backend có dữ liệu thật, api.ts sẽ ưu tiên API và chỉ dùng mock khi fetch lỗi.

import type { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p-ca-phe-sua', name: 'Cà phê sữa', price: 35000, imageUrl: '', stock: 50, version: 1 },
  { id: 'p-americano', name: 'Americano', price: 40000, imageUrl: '', stock: 50, version: 1 },
  { id: 'p-cappuccino', name: 'Cappuccino', price: 45000, imageUrl: '', stock: 50, version: 1 },
  { id: 'p-tra-dao', name: 'Trà đào', price: 39000, imageUrl: '', stock: 50, version: 1 },
];
