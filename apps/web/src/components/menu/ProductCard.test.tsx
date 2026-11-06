import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { product } from '@/test/helpers';
import { ProductCard } from './ProductCard';

describe('UNIT-T14 product card (FR-01)', () => {
  it('shows name, image, VND price and a selectable product', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('heading', { name: 'Cappuccino' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cappuccino' })).toBeInTheDocument();
    expect(screen.getByText('45.000đ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
  });
  it('blocks selecting a sold-out product', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />);
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeDisabled();
  });
  // AC-F01.3 revised by merged PR30: customers see availability, not cup counts.
  it.each([1, 5])('shows only in-stock availability for positive stock %i (AC-F01.3)', (stock) => {
    render(<ProductCard product={{ ...product, stock }} />);
    expect(screen.getByText('Còn hàng')).toBeInTheDocument();
    expect(screen.queryByText(/Sắp hết|còn \d+/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
  });
  it.each([6, 8, 99])('shows exactly "Còn hàng" and no cup count for stock %i above the low threshold (AC-F01.3)', (stock) => {
    const { container } = render(<ProductCard product={{ ...product, stock }} />);
    expect(screen.getByText('Còn hàng')).toBeInTheDocument();
    expect(screen.queryByText(/Sắp hết|còn \d+/i)).not.toBeInTheDocument();
    // The only digits on the card belong to the price; the stock number must not leak anywhere in the text.
    expect(container.textContent).not.toContain(String(stock));
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
  });
});
