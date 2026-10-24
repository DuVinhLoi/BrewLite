import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useShop } from './ShopProvider';
import { CartScreen } from './CartScreen';

vi.mock('./ShopProvider', () => ({ useShop: vi.fn() }));

const quantity = vi.fn();
const line = {
  key: 'cappuccino-L-pearls', productId: 'cappuccino', name: 'Cappuccino',
  size: 'L', toppings: ['Trân châu'], quantity: 1, unitPrice: 62000,
};

function renderCart(count = 1) {
  vi.mocked(useShop).mockReturnValue({
    cart: [{ ...line, quantity: count }], ready: true, session: null, quantity,
    add: vi.fn(), clear: vi.fn(), login: vi.fn(), logout: vi.fn(),
  });
  render(<CartScreen />);
}

beforeEach(() => { quantity.mockClear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('CartScreen: AC-F06.2, AC-F06.3, AC-F07.1', () => {
  it('UNIT-P2-01: hủy xác nhận giữ lại dòng có số lượng 1', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'Giảm Cappuccino' }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(quantity).not.toHaveBeenCalled();
  });

  it('UNIT-P2-02: đồng ý xác nhận xóa dòng có số lượng 1', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'Giảm Cappuccino' }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(quantity).toHaveBeenCalledExactlyOnceWith(line.key, 0);
  });

  it('UNIT-P2-03: giảm số lượng 2 xuống 1 mà không hỏi xác nhận', () => {
    const confirm = vi.spyOn(window, 'confirm');
    renderCart(2);
    fireEvent.click(screen.getByRole('button', { name: 'Giảm Cappuccino' }));
    expect(confirm).not.toHaveBeenCalled();
    expect(quantity).toHaveBeenCalledExactlyOnceWith(line.key, 1);
  });

  it('UNIT-P2-04: hiển thị đơn giá, thành tiền dòng và tổng giỏ riêng', () => {
    renderCart(2);
    expect(screen.getByText('62.000đ', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Thành tiền: 124.000đ', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Tổng tiền: 124.000đ', { exact: true })).toBeInTheDocument();
  });

  it('UNIT-P2-05: nút Xóa xóa ngay mà không hỏi xác nhận', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderCart(2);
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    expect(confirm).not.toHaveBeenCalled();
    expect(quantity).toHaveBeenCalledExactlyOnceWith(line.key, 0);
  });
});
