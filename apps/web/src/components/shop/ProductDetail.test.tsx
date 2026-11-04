import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@/lib/inventory';
import { available, deferred, json, mockApi, options, product, renderShop } from '@/test/helpers';
import { ProductDetail } from './ProductDetail';

function catalog(path: string) {
  if (path === '/products/cappuccino') return json(product);
  if (path === '/catalog/options') return json(options);
  throw new Error(`Unexpected path: ${path}`);
}

describe('UNIT-T15 product choices (FR-03, FR-04)', () => {
  it('defaults to M and updates the displayed price and availability payload for size/toppings', async () => {
    mockApi((path, init) => path === '/inventory/availability' ? json(available(JSON.parse(String(init.body)).items)) : catalog(path));
    renderShop(<ProductDetail id="cappuccino" />);
    expect(await screen.findByRole('radio', { name: 'M (+5.000đ)' })).toBeChecked();
    expect(screen.getByText('50.000đ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'L (+10.000đ)' }));
    expect(screen.getByText('55.000đ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Trân châu (+7.000đ)' }));
    expect(screen.getByText('62.000đ')).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/inventory\/availability$/), expect.objectContaining({ method: 'POST', body: JSON.stringify({ items: [{ productId: 'cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 1 }] }) })));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Trân châu (+7.000đ)' }));
    expect(screen.getByText('55.000đ')).toBeInTheDocument();
  });
  it('ignores an older availability result after a new size is selected', async () => {
    const old = deferred<Response>();
    mockApi((path, init) => {
      if (path !== '/inventory/availability') return catalog(path);
      const { items } = JSON.parse(String(init.body)) as { items: InventoryItem[] };
      return items[0].size === 'M' ? old.promise : json(available(items, 3));
    });
    renderShop(<ProductDetail id="cappuccino" />);
    fireEvent.click(await screen.findByRole('radio', { name: 'L (+10.000đ)' }));
    await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Số lượng' })).toHaveAttribute('max', '3'));
    await act(async () => old.resolve(json({ canOrder: false, lines: [{ productId: 'cappuccino', size: 'M', toppings: [], quantity: 1, cups: 0, sellable: false, limitingIngredients: [], reason: 'RECIPE_UNAVAILABLE' }], shortages: [] })));
    expect(screen.getByRole('radio', { name: 'L (+10.000đ)' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Số lượng' })).toHaveAttribute('max', '3');
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
  });
  it('checks the whole proposed cart before adding and persists the selected line', async () => {
    mockApi((path, init) => path === '/inventory/availability' ? json(available(JSON.parse(String(init.body)).items)) : catalog(path));
    renderShop(<ProductDetail id="cappuccino" />);
    const add = await screen.findByRole('button', { name: 'Thêm vào giỏ' });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Số lượng' }), { target: { value: '2' } });
    fireEvent.click(add);
    expect(await screen.findByText('Đã thêm vào giỏ hàng')).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([{ key: '["cappuccino","M",[]]', productId: 'cappuccino', name: 'Cappuccino', size: 'M', toppings: [], quantity: 2, unitPrice: 50000 }]));
  });
  it('blocks adding when the recipe is unavailable', async () => {
    mockApi((path, init) => {
      if (path !== '/inventory/availability') return catalog(path);
      const result = available(JSON.parse(String(init.body)).items, 0);
      return json({ ...result, canOrder: false, lines: result.lines.map((item) => ({ ...item, sellable: false, reason: 'Chưa có công thức hợp lệ cho lựa chọn này' })) });
    });
    renderShop(<ProductDetail id="cappuccino" />);
    expect(await screen.findByRole('heading', { name: 'Cappuccino' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Số lượng' })).toHaveAttribute('max', '0'));
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeDisabled();
    expect(localStorage.getItem('brewlite-cart')).toBe('[]');
  });
  // AC-F04.4: current detail hides the recipe-unavailable reason. Fix: https://github.com/DuVinhLoi/BrewLite/pull/30
  it.skip('explains that a missing recipe is unavailable (AC-F04.4)', async () => {
    mockApi((path, init) => {
      if (path !== '/inventory/availability') return catalog(path);
      const result = available(JSON.parse(String(init.body)).items, 0);
      return json({ ...result, canOrder: false, lines: result.lines.map((item) => ({ ...item, sellable: false, reason: 'Chưa có công thức hợp lệ cho lựa chọn này' })) });
    });
    renderShop(<ProductDetail id="cappuccino" />);
    expect(await screen.findByText('Chưa có công thức hợp lệ cho lựa chọn này')).toBeInTheDocument();
  });
  // AC-F04.4: current detail hides cups and limiting ingredients. Fix: https://github.com/DuVinhLoi/BrewLite/pull/30
  it.skip('shows available cups and the limiting ingredient (AC-F04.4)', async () => {
    mockApi((path, init) => path === '/inventory/availability' ? json(available(JSON.parse(String(init.body)).items, 3)) : catalog(path));
    renderShop(<ProductDetail id="cappuccino" />);
    expect(await screen.findByText(/còn 3 ly/i)).toBeInTheDocument();
    expect(screen.getByText(/Sữa/)).toBeInTheDocument();
  });
});
