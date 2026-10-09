import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { MOCK_PRODUCTS } from './mock-products';

describe('MOCK_PRODUCTS', () => {
  test('mỗi món mẫu có ảnh SVG tĩnh trong public/images (cùng bộ ảnh với seed backend)', () => {
    for (const p of MOCK_PRODUCTS) {
      expect(p.imageUrl, p.name).toMatch(/^\/images\/[a-z-]+\.svg$/);
      expect(existsSync(join(process.cwd(), 'public', p.imageUrl)), p.imageUrl).toBe(true);
    }
  });
});
