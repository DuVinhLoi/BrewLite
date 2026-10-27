import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApiError } from '@/lib/api';
import { shopApi } from '@/lib/shop';
import { useShop } from './ShopProvider';
import { CheckoutScreen } from './CheckoutScreen';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('./ShopProvider', () => ({ useShop: vi.fn() }));
vi.mock('@/lib/shop', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/shop')>()), shopApi: vi.fn() }));

const line = {
  key: 'cappuccino-L-pearls', productId: 'cappuccino', name: 'Cappuccino',
  size: 'L', toppings: ['Trân châu'], quantity: 2, unitPrice: 62000,
};
const store = {
  cart: [line], ready: true, session: { token: 'token-1', email: 'demo@test.local', role: 'CUSTOMER' },
  add: vi.fn(), quantity: vi.fn(), clear: vi.fn(), login: vi.fn(), logout: vi.fn(),
};
const order = {
  id: 'order-1', status: 'PAYMENT_FAILED', total: 35000, createdAt: '2026-10-25T00:00:00.000Z',
  items: [{ id: 'item-1', productId: 'latte', name: 'Latte', size: 'M', toppings: [], quantity: 1, unitPrice: 35000, lineTotal: 35000 }],
};
const cardError = 'Số thẻ demo phải gồm 16 chữ số';

async function renderCheckout() {
  vi.mocked(useShop).mockReturnValue(store);
  render(<CheckoutScreen />);
  await screen.findByRole('heading', { name: 'Thanh toán mô phỏng' });
}

function chooseCard(number: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Phương thức' }), { target: { value: 'CARD' } });
  fireEvent.change(screen.getByLabelText('Số thẻ demo'), { target: { value: number } });
}

beforeEach(() => { vi.mocked(shopApi).mockReset(); sessionStorage.clear(); });

describe('CheckoutScreen: AC-F14.5, UC-04 bước 2, C3', () => {
  it('UNIT-P3-01: số thẻ thiếu chữ số báo lỗi tại ô và không gọi API', async () => {
    await renderCheckout();
    chooseCard('1234');
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    const input = screen.getByLabelText('Số thẻ demo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(cardError);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(shopApi).not.toHaveBeenCalled();
  });

  it('UNIT-P3-02: sửa số thẻ hoặc đổi phương thức thì lỗi tại ô biến mất', async () => {
    await renderCheckout();
    chooseCard('1234');
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    fireEvent.change(screen.getByLabelText('Số thẻ demo'), { target: { value: '12345' } });
    expect(screen.getByLabelText('Số thẻ demo')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(cardError)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    expect(screen.getByText(cardError)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Phương thức' }), { target: { value: 'WALLET' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Phương thức' }), { target: { value: 'CARD' } });
    expect(screen.queryByText(cardError)).not.toBeInTheDocument();
  });

  it('UNIT-P3-03: chưa có đơn thì tóm tắt các dòng trong giỏ', async () => {
    await renderCheckout();
    expect(screen.getByRole('heading', { name: 'Tóm tắt đơn' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['2 × Cappuccino · Size L · Trân châu']);
    expect(screen.getByText('Tổng tiền: 124.000đ', { exact: true })).toBeInTheDocument();
  });

  it('UNIT-P3-04: thanh toán lại đơn PAYMENT_FAILED thì tóm tắt các dòng của đơn', async () => {
    sessionStorage.setItem('brewlite-checkout:demo@test.local', JSON.stringify({ orderId: order.id, key: 'key-1' }));
    vi.mocked(shopApi).mockResolvedValueOnce(order);
    await renderCheckout();
    expect(screen.getByText('Mã đơn: order-1')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['1 × Latte · Size M · Không topping']);
    expect(screen.getByRole('button', { name: 'Thử lại thanh toán' })).toBeEnabled();
  });

  it('UNIT-P3-05: thanh toán bị từ chối 402 chỉ hiện một alert và giữ giỏ', async () => {
    vi.mocked(shopApi).mockResolvedValueOnce({ ...order, status: 'PENDING' }).mockRejectedValueOnce(new ApiError('Thẻ bị từ chối', 402));
    await renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Đơn của bạn vẫn được giữ');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(store.clear).not.toHaveBeenCalled();
  });
});
