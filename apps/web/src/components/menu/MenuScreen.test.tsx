import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Product } from '@/lib/api';
import { MenuScreen } from './MenuScreen';

const products: Product[] = [
  { id: 'ca-phe-sua', name: 'Cà phê sữa', description: '', price: 35000, imageUrl: '/images/ca-phe-sua.svg', stock: 50 },
  { id: 'americano', name: 'Americano', description: '', price: 40000, imageUrl: '/images/americano.svg', stock: 50 },
  { id: 'cappuccino', name: 'Cappuccino', description: '', price: 45000, imageUrl: '/images/cappuccino.svg', stock: 30 },
  { id: 'tra-dao', name: 'Trà đào', description: '', price: 39000, imageUrl: '/images/tra-dao.svg', stock: 30 },
  { id: 'tra-sua-tran-chau', name: 'Trà sữa trân châu', description: '', price: 42000, imageUrl: '/images/tra-sua-tran-chau.svg', stock: 20 },
  { id: 'matcha-latte', name: 'Matcha latte', description: '', price: 48000, imageUrl: '/images/matcha-latte.svg', stock: 20 },
  { id: 'bac-xiu', name: 'Bạc xỉu', description: '', price: 38000, imageUrl: '/images/bac-xiu.svg', stock: 3 },
  { id: 'cold-brew', name: 'Cold brew', description: '', price: 45000, imageUrl: '/images/cold-brew.svg', stock: 0 },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UNIT-T04..T06: MenuScreen', () => {
  it('UNIT-T04: hiển thị skeleton khi đang tải rồi hiện đủ 8 thẻ món', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(products)));

    render(<MenuScreen />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');

    const grid = await screen.findByRole('list', { name: 'Danh sách đồ uống' });
    expect(grid).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getAllByText('45.000đ')).toHaveLength(2);
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByText('Sắp hết, còn 3')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('UNIT-T05: danh sách rỗng hiển thị "Hiện chưa có món nào" và không có lưới', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    render(<MenuScreen />);

    expect(await screen.findByText('Hiện chưa có món nào')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Danh sách đồ uống' })).not.toBeInTheDocument();
  });

  it('UNIT-T06: lỗi hiển thị "Không tải được thực đơn" và bấm "Thử lại" tải lại thành công', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network error'))
      .mockResolvedValueOnce(jsonResponse(products));
    vi.stubGlobal('fetch', fetchMock);

    render(<MenuScreen />);

    expect(await screen.findByText('Không tải được thực đơn')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Không tải được thực đơn');

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('list', { name: 'Danh sách đồ uống' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('UNIT-T07: HTTP 503 hiển thị lỗi và thử lại thành công thay vì dùng body lỗi làm sản phẩm', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'Service unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse(products));
    vi.stubGlobal('fetch', fetchMock);

    render(<MenuScreen />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thực đơn');
    expect(screen.queryByRole('list', { name: 'Danh sách đồ uống' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('list', { name: 'Danh sách đồ uống' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
