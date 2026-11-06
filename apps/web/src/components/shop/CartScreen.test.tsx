import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { available, availabilityApi, json, line, mockApi, renderShop } from '@/test/helpers';
import { CartScreen } from './CartScreen';

describe('UNIT-T16 cart controls (FR-05–FR-07)', () => {
  it('shows an empty cart with checkout disabled and a menu link', async () => {
    renderShop(<CartScreen />);
    expect(await screen.findByText('Giỏ hàng trống')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Tiếp tục chọn món' })).toHaveAttribute('href', '/');
  });
  it('shows unit, line and cart totals and updates them after increasing and decreasing', async () => {
    availabilityApi();
    renderShop(<CartScreen />, [line]);
    expect(await screen.findByText('62.000đ')).toBeInTheDocument();
    expect(screen.getByText('Thành tiền: 124.000đ')).toBeInTheDocument();
    expect(screen.getByText('Tổng tiền: 124.000đ')).toBeInTheDocument();
    const increase = screen.getByRole('button', { name: 'Tăng Cappuccino' });
    await waitFor(() => expect(increase).toBeEnabled());
    fireEvent.click(increase);
    expect(screen.getByLabelText('Số lượng Cappuccino')).toHaveTextContent('3');
    expect(screen.getByText('Tổng tiền: 186.000đ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Giảm Cappuccino' }));
    expect(screen.getByText('Tổng tiền: 124.000đ')).toBeInTheDocument();
  });
  it('removes only the selected line', async () => {
    availabilityApi();
    renderShop(<CartScreen />, [line, { ...line, key: 'americano', name: 'Americano', productId: 'americano', quantity: 1, unitPrice: 45000 }]);
    expect(await screen.findByText('Tổng tiền: 169.000đ')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0]);
    expect(screen.queryByRole('heading', { name: 'Cappuccino' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Americano' })).toBeInTheDocument();
    expect(screen.getByText('Tổng tiền: 45.000đ')).toBeInTheDocument();
  });
  it('requires confirmation when decrementing the final cup', async () => {
    availabilityApi();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderShop(<CartScreen />, [{ ...line, quantity: 1 }]);
    const decrease = await screen.findByRole('button', { name: 'Giảm Cappuccino' });
    fireEvent.click(decrease);
    expect(confirm).toHaveBeenCalledWith('Xóa Cappuccino khỏi giỏ hàng?');
    expect(screen.getByLabelText('Số lượng Cappuccino')).toHaveTextContent('1');
    confirm.mockReturnValue(true);
    fireEvent.click(decrease);
    expect(screen.getByText('Giỏ hàng trống')).toBeInTheDocument();
  });
  it('disables the increase control at 99 cups', async () => {
    availabilityApi();
    renderShop(<CartScreen />, [{ ...line, quantity: 99 }]);
    expect(await screen.findByRole('button', { name: 'Tăng Cappuccino' })).toBeDisabled();
  });
  it('keeps insufficient cart contents and blocks checkout for combined ingredient demand', async () => {
    mockApi((_path, init) => {
      const result = available(JSON.parse(String(init.body)).items);
      return json({ ...result, canOrder: false, shortages: [{ ingredientId: 'milk', name: 'Sữa', unit: 'ml', requested: '300', available: '100' }] });
    });
    renderShop(<CartScreen />, [line, { ...line, key: 'americano', productId: 'americano', name: 'Americano', quantity: 1, toppings: [] }]);
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Sữa: cần 300 ml, còn 100 ml');
    expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tăng Cappuccino' })).toBeDisabled();
    expect(screen.getByLabelText('Số lượng Cappuccino')).toHaveTextContent('2');
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/inventory\/availability$/), expect.objectContaining({ body: JSON.stringify({ items: [{ productId: 'cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 2 }, { productId: 'americano', size: 'L', toppings: [], quantity: 1 }] }) }));
  });
  it.each([[false, '/login?next=/checkout'], [true, '/checkout']] as const)('routes checkout correctly when authenticated=%s', async (loggedIn, href) => {
    availabilityApi();
    renderShop(<CartScreen />, [line], loggedIn);
    expect(await screen.findByRole('link', { name: 'Thanh toán' })).toHaveAttribute('href', href);
  });
});
