import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CheckoutScreen } from './CheckoutScreen';

const push = vi.fn();
const replace = vi.fn();
const clear = vi.fn();
const logout = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./ShopProvider', () => ({
  useShop: () => ({
    ready: true,
    session: { email: 'demo@brewlite.test', token: 'token-1', role: 'CUSTOMER' },
    cart: [
      {
        key: 'line-1',
        productId: 'p1',
        name: 'Cappuccino',
        size: 'L',
        toppings: ['Trân châu'],
        quantity: 2,
        unitPrice: 45000,
      },
    ],
    clear,
    logout,
  }),
}));

vi.mock('@/lib/shop', () => ({
  shopApi: vi.fn(),
  cartTotal: (lines: Array<{ unitPrice: number; quantity: number }>) =>
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
}));

vi.mock('@/lib/format', () => ({
  formatVnd: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
}));

const { shopApi } = await import('@/lib/shop');

describe('CheckoutScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('shows inline validation error for invalid card input and blocks API call', async () => {
    render(<CheckoutScreen />);

    fireEvent.click(screen.getByLabelText('Thẻ'));
    const input = screen.getByLabelText('Số thẻ demo');

    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trả' }));

    expect(screen.getByText('Số thẻ demo phải gồm 16 chữ số')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'card-error');
    expect(shopApi).not.toHaveBeenCalled();
  });

  it('renders order summary and clears card validation after fixing the card number', () => {
    render(<CheckoutScreen />);

    fireEvent.click(screen.getByLabelText('Thẻ'));
    const input = screen.getByLabelText('Số thẻ demo');

    fireEvent.change(input, { target: { value: '1234' } });
    expect(screen.getByText('Số thẻ demo phải gồm 16 chữ số')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '4242424242424242' } });

    expect(screen.queryByText('Số thẻ demo phải gồm 16 chữ số')).not.toBeInTheDocument();
    expect(screen.getByText('Tóm tắt đơn')).toBeInTheDocument();
    expect(screen.getByText('Cappuccino')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('Trân châu')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    expect(screen.getByText('Tổng tiền: 90.000 ₫')).toBeInTheDocument();
  });
});
