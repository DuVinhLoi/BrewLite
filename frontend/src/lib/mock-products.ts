// Menu mẫu theo wireframe PDF — chỉ dùng khi chưa cấu hình NEXT_PUBLIC_API_URL (getProducts trả menu mẫu để demo UI không cần backend).
// Ảnh dùng cùng bộ SVG tĩnh với seed backend (public/images).

import type { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p-ca-phe-sua', name: 'Cà phê sữa', price: 35000, imageUrl: '/images/latte.svg', stock: 50, version: 1 },
  { id: 'p-americano', name: 'Americano', price: 40000, imageUrl: '/images/americano.svg', stock: 50, version: 1 },
  { id: 'p-cappuccino', name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.svg', stock: 50, version: 1 },
  { id: 'p-tra-dao', name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.svg', stock: 50, version: 1 },
];
