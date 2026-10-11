import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import ProductGrid from './ProductGrid';

// Không có DOM: render ra HTML, kiểm chữ và thuộc tính. Không kiểm được thao tác bấm "Thử lại".
const render = (props: Partial<Parameters<typeof ProductGrid>[0]>) =>
  renderToStaticMarkup(
    createElement(ProductGrid, { products: [], loading: false, error: null, fromMock: false, onRetry: vi.fn(), ...props }),
  );

describe('ProductGrid: loading', () => {
  const out = render({ loading: true });

  test('giữ aria-busy và nhãn "Đang tải menu"', () => {
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('aria-label="Đang tải menu"');
  });

  test('wrapper có role="status" (trình đọc màn hình không bỏ qua nhãn)', () => {
    expect(out).toMatch(/^<div[^>]*role="status"[^>]*aria-label="Đang tải menu"/);
  });

  test('4 thẻ khung xương cùng dáng thẻ món: ảnh 4:3, 2 dòng chữ, nút', () => {
    expect(out.match(/class="[^"]*skeletonCard/g)).toHaveLength(4);
    // mỗi thẻ 4 khối Skeleton: ô ảnh 4:3, dòng tên (70%), dòng giá (45%), nút viên
    expect(out.match(/class="[^"]*skeleton[^"]*" style=/g)).toHaveLength(16);
    expect(out.match(/aspect-ratio:4 \/ 3/g)).toHaveLength(4);
    expect(out.match(/width:70%/g)).toHaveLength(4);
    expect(out.match(/width:45%/g)).toHaveLength(4);
    expect(out.match(/class="[^"]*skeletonButton/g)).toHaveLength(4);
    expect(out).not.toContain('height:120px');
  });

  test('khung xương nằm trong lưới cùng lớp grid với thẻ món', () => {
    expect(out).toMatch(/^<div class="[^"]*grid[^"]*" aria-busy="true"/);
  });

  test('không hiện lỗi hay trạng thái rỗng', () => {
    expect(out).not.toContain('Không tải được menu.');
    expect(out).not.toContain('Chưa có món nào.');
  });
});

describe('ProductGrid: lỗi', () => {
  test('ErrorState với cốc nghiêng, câu tiêu đề, chi tiết lỗi bên dưới và nút Thử lại', () => {
    const out = render({ error: 'GET /products lỗi (mã 500).' });
    expect(out).toContain('role="alert"');
    expect(out).toContain('src="/doodles/mug.svg"');
    expect(out).toContain('Không tải được menu.');
    expect(out).toContain('Thử lại');
    expect(out).toContain('GET /products lỗi (mã 500).');
    expect(out.indexOf('Không tải được menu.')).toBeLessThan(out.indexOf('GET /products lỗi (mã 500).'));
  });

  test('chi tiết lỗi nằm trong khối role="alert" cùng câu tiêu đề, không phải thẻ rời bên ngoài', () => {
    const out = render({ error: 'GET /products lỗi (mã 500).' });
    // ErrorState không lồng thẻ div: div đóng đầu tiên sau role="alert" là hết khối
    const alertBlock = out.slice(out.indexOf('role="alert"'), out.indexOf('</div>', out.indexOf('role="alert"')));
    expect(alertBlock).toContain('Không tải được menu.');
    expect(alertBlock).toContain('GET /products lỗi (mã 500).');
    expect(alertBlock).toContain('Thử lại');
  });

  test('không còn emoji 😢', () => {
    expect(render({ error: 'x' })).not.toContain('😢');
  });

  test('lỗi thắng trạng thái rỗng (products=[] do lỗi không phải menu trống)', () => {
    const out = render({ error: 'x', products: [] });
    expect(out).toContain('Không tải được menu.');
    expect(out).not.toContain('Chưa có món nào.');
  });
});

describe('ProductGrid: rỗng', () => {
  const out = render({});

  test('EmptyState với túi hạt, tiêu đề và gợi ý', () => {
    expect(out).toContain('src="/doodles/bag.svg"');
    expect(out).toContain('Chưa có món nào.');
    expect(out).toContain('Menu đang trống. Quay lại sau nhé!');
  });

  test('không có nút Thử lại', () => {
    expect(out).not.toContain('Thử lại');
  });
});

describe('ProductGrid: có món', () => {
  const products = [{ id: 'p1', name: 'Latte', price: 35000, imageUrl: '', stock: 3, version: 1 }];

  test('hiện tên món, không hiện khung xương / lỗi / rỗng', () => {
    const out = render({ products });
    expect(out).toContain('Latte');
    expect(out).not.toContain('aria-busy');
    expect(out).not.toContain('Chưa có món nào.');
  });

  test('banner menu mẫu chỉ hiện khi fromMock, giữ nguyên chữ, dùng lớp thay cho style inline', () => {
    const out = render({ products, fromMock: true });
    expect(out).toContain(
      'Đang hiển thị menu mẫu vì chưa cấu hình NEXT_PUBLIC_API_URL. Đặt biến này (xem .env.example) để dùng API thật.',
    );
    expect(out).toMatch(/<p class="[^"]*mockBanner[^"]*">Đang hiển thị menu mẫu/);
    expect(out).not.toContain('style=');
    expect(render({ products })).not.toContain('Đang hiển thị menu mẫu');
  });

  test('mỗi món một thẻ <article> trong lưới lớp grid', () => {
    const two = [...products, { id: 'p2', name: 'Americano', price: 40000, imageUrl: '', stock: 0, version: 1 }];
    const out = render({ products: two });
    expect(out.match(/<article\b/g)).toHaveLength(2);
    expect(out).toMatch(/<div class="[^"]*grid[^"]*"><article/);
  });
});
