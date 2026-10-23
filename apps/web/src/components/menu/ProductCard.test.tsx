import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Product } from '@/lib/api';
import { ProductCard } from './ProductCard';

function product(overrides: Partial<Product>): Product {
  return {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso kết hợp sữa nóng và lớp bọt mịn.',
    price: 45000,
    imageUrl: '/images/cappuccino.svg',
    stock: 30,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UNIT-T03: ProductCard', () => {
  it('hiển thị hình, tên và giá dạng 45.000đ', () => {
    render(<ProductCard product={product({})} />);

    expect(screen.getByRole('img', { name: 'Cappuccino' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cappuccino' })).toBeInTheDocument();
    expect(screen.getByText('45.000đ')).toBeInTheDocument();
    expect(screen.getByText('Còn 30')).toBeInTheDocument();
  });

  it('món hết hàng hiển thị "Hết hàng" và nút "Thêm vào giỏ" bị vô hiệu', () => {
    render(<ProductCard product={product({ id: 'cold-brew', name: 'Cold brew', stock: 0 })} />);

    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeDisabled();
  });

  it('món sắp hết hiển thị "Sắp hết, còn N" và nút vẫn dùng được', () => {
    render(<ProductCard product={product({ id: 'bac-xiu', name: 'Bạc xỉu', stock: 3 })} />);

    expect(screen.getByText('Sắp hết, còn 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
  });
});
