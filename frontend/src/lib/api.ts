// ============================================================
// FEATURE: Menu API — GET /products, lỗi thì fallback menu mẫu để vẫn demo được.
// ============================================================

import type { Product } from './types';
import { MOCK_PRODUCTS } from './mock-products';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface RawProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  image?: string;
  stock?: number;
  version?: number;
}

function normalize(raw: RawProduct): Product {
  return {
    id: String(raw.id),
    name: String(raw.name),
    price: Number(raw.price),
    imageUrl: raw.imageUrl ?? raw.image ?? '',
    stock: Number(raw.stock ?? 999),
    version: raw.version !== undefined ? Number(raw.version) : 1,
  };
}

export async function getProducts(): Promise<{ data: Product[]; fromMock: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`GET /products -> ${res.status}`);
    const json = await res.json();
    const list: RawProduct[] = Array.isArray(json) ? json : json.data ?? json.items ?? [];
    if (!Array.isArray(list) || list.length === 0) return { data: MOCK_PRODUCTS, fromMock: true };
    return { data: list.map(normalize), fromMock: false };
  } catch {
    return { data: MOCK_PRODUCTS, fromMock: true };
  }
}
