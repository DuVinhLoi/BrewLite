import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '@/lib/inventory';
import { available, deferred, json, line, mockApi, options, product, renderShop } from '@/test/helpers';
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
    const requests: InventoryItem[][] = [];
    mockApi((path, init) => {
      if (path !== '/inventory/availability') return catalog(path);
      const { items } = JSON.parse(String(init.body)) as { items: InventoryItem[] };
      requests.push(items);
      return json(available(items));
    });
    renderShop(<ProductDetail id="cappuccino" />, [line]);
    const add = await screen.findByRole('button', { name: 'Thêm vào giỏ' });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Số lượng' }), { target: { value: '2' } });
    requests.length = 0;
    fireEvent.click(add);
    expect(await screen.findByText('Đã thêm vào giỏ hàng')).toBeInTheDocument();
    expect(requests).toContainEqual([
      { productId: 'cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 2 },
      { productId: 'cappuccino', size: 'M', toppings: [], quantity: 2 },
    ]);
    await waitFor(() => expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line, { key: '["cappuccino","M",[]]', productId: 'cappuccino', name: 'Cappuccino', size: 'M', toppings: [], quantity: 2, unitPrice: 50000 }]));
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
  it('keeps the existing cart when a new choice has no recipe (AC-F04.4)', async () => {
    mockApi((path, init) => {
      if (path !== '/inventory/availability') return catalog(path);
      const result = available(JSON.parse(String(init.body)).items, 0);
      return json({ ...result, canOrder: false, lines: result.lines.map((item) => ({ ...item, sellable: false, reason: 'Chưa có công thức hợp lệ cho lựa chọn này' })) });
    });
    renderShop(<ProductDetail id="cappuccino" />, [line]);
    await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Số lượng' })).toHaveAttribute('max', '0'));
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ' })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  it('uses capacity to clamp excess quantity and rejects a fractional quantity within the limit (AC-F04.4)', async () => {
    mockApi((path, init) => path === '/inventory/availability' ? json(available(JSON.parse(String(init.body)).items, 3)) : catalog(path));
    renderShop(<ProductDetail id="cappuccino" />);
    const add = await screen.findByRole('button', { name: 'Thêm vào giỏ' });
    await waitFor(() => expect(add).toBeEnabled());
    const quantity = screen.getByRole('spinbutton', { name: 'Số lượng' });
    expect(quantity).toHaveAttribute('max', '3');
    fireEvent.change(quantity, { target: { value: '2.5' } });
    expect(screen.getByText('Số lượng phải là số nguyên từ 1 đến 3')).toBeInTheDocument();
    expect(add).toBeDisabled();
    fireEvent.change(quantity, { target: { value: '4.5' } });
    expect(quantity).toHaveValue(3);
    expect(add).toBeEnabled();
  });
  it.each([['blank', ''], ['zero', '0'], ['negative', '-1']])('rejects a %s quantity with the 1-to-N message and blocks adding (AC-F04.4)', async (_name, value) => {
    mockApi((path, init) => path === '/inventory/availability' ? json(available(JSON.parse(String(init.body)).items, 3)) : catalog(path));
    renderShop(<ProductDetail id="cappuccino" />);
    const add = await screen.findByRole('button', { name: 'Thêm vào giỏ' });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Số lượng' }), { target: { value } });
    expect(screen.getByText('Số lượng phải là số nguyên từ 1 đến 3')).toBeInTheDocument();
    const requests = vi.mocked(fetch).mock.calls.length;
    fireEvent.click(add);
    await act(async () => {});
    // Clicking must neither start the add-to-cart check nor add anything.
    expect(fetch).toHaveBeenCalledTimes(requests);
    expect(screen.queryByText('Đã thêm vào giỏ hàng')).not.toBeInTheDocument();
    expect(localStorage.getItem('brewlite-cart')).toBe('[]');
    expect(add).toBeDisabled();
  });
  it('shows the shortage found at click time with requested and available amounts and keeps the cart (AC-F04.4)', async () => {
    let clicked = false;
    mockApi((path, init) => {
      if (path !== '/inventory/availability') return catalog(path);
      const { items } = JSON.parse(String(init.body)) as { items: InventoryItem[] };
      return json(clicked ? { ...available(items), canOrder: false, shortages: [{ ingredientId: 'milk', name: 'Sữa', unit: 'ml', requested: '300', available: '100' }] } : available(items));
    });
    renderShop(<ProductDetail id="cappuccino" />, [line]);
    const add = await screen.findByRole('button', { name: 'Thêm vào giỏ' });
    await waitFor(() => expect(add).toBeEnabled());
    clicked = true; // the button was open; only the check made at click time reports the shortage
    fireEvent.click(add);
    expect(await screen.findByRole('alert')).toHaveTextContent('Sữa: cần 300 ml, còn 100 ml');
    expect(screen.queryByText('Đã thêm vào giỏ hàng')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('brewlite-cart')!)).toEqual([line]);
  });
  it('shows no cup-count label anywhere on the page (AC-F01.3, AC-F04.4)', async () => {
    mockApi((path, init) => path === '/inventory/availability' ? json(available(JSON.parse(String(init.body)).items, 8)) : catalog(path));
    renderShop(<ProductDetail id="cappuccino" />);
    const add = await screen.findByRole('button', { name: 'Thêm vào giỏ' });
    await waitFor(() => expect(add).toBeEnabled());
    // Match per element: textContent joins neighbours ("8 lyThêm"), so a trailing \b would never match there.
    expect(screen.queryAllByText(/Sắp hết|còn \d+|\d+\s*ly\b/i)).toHaveLength(0);
    // A count split across child elements only shows in the joined text. No i flag: an uppercase letter after "ly" is the next element.
    expect(document.body.textContent).not.toMatch(/Sắp hết|[Cc]òn \d+|\d+\s*ly(?![a-zà-ỹ])/);
  });
});
