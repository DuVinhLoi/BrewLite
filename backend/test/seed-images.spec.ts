import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Đề §8 Task 2: GET /products trả (id, tên, giá, ảnh). Seed đặt imageUrl cho p1..p4 trỏ tới SVG tĩnh của frontend.
const root = join(__dirname, '..', '..');
const seed = join(root, 'backend', 'prisma', 'seed.ts');

// Chỉ chạy được khi chạy từ repo đầy đủ (trong image backend không có thư mục frontend)
const repo = existsSync(seed) && existsSync(join(root, 'frontend', 'public')) ? describe : describe.skip;

repo('seed imageUrl', () => {
  const src = readFileSync(seed, 'utf8');

  test('mỗi món p1..p4 trong seed có ảnh, đặt ở cả create lẫn update, và file ảnh tồn tại', () => {
    const urls = [...src.matchAll(/imageUrl:\s*'(\/images\/[a-z-]+\.svg)'/g)].map((m) => m[1]);
    // p1 có create + update; p2..p4 khai báo 1 lần rồi dùng cho cả create (spread) lẫn update
    expect(new Set(urls)).toEqual(new Set(['/images/latte.svg', '/images/americano.svg', '/images/cappuccino.svg', '/images/tra-dao.svg']));
    for (const u of urls) expect(existsSync(join(root, 'frontend', 'public', u))).toBe(true);
    // update của p1 và vòng lặp p2..p4 phải ghi imageUrl để DB cũ được cập nhật khi khởi động lại
    expect(src).toMatch(/update:\s*\{[^}]*imageUrl/);
  });
});
