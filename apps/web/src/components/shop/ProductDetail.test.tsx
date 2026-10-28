import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Product } from '@/lib/api';
import { cartKey, type CartLine, type Options } from '@/lib/shop';
import { ShopProvider } from './ShopProvider';
import { ProductDetail } from './ProductDetail';

const product: Product = {
  id: 'cappuccino', name: 'Cappuccino', description: 'Cà phê sữa bọt',
  price: 45000, imageUrl: '', stock: 30,
};
const options: Options = {
  sizes: { S: 0, M: 5000, L: 10000 },
  toppings: { 'Trân châu': 7000, 'Kem phô mai': 10000 },
};
const LIMIT = 'Đã đạt số lượng tối đa còn lại';

function makeLine(
  quantity: number, size = 'M', toppings: string[] = [], productId = product.id,
): CartLine {
  return {
    key: cartKey(productId, size, toppings), productId, name: product.name,
    size, toppings, quantity,
    unitPrice: product.price + options.sizes[size]
      + toppings.reduce((sum, topping) => sum + options.toppings[topping], 0),
  };
}
function otherLines(count: number): CartLine[] {
  return Array.from({ length: count }, (_, i) => makeLine(1, 'M', [], `other-${i}`));
}
function readCart(): CartLine[] {
  return JSON.parse(localStorage.getItem('brewlite-cart') ?? '[]');
}
function quantityInput() {
  return screen.getByRole('spinbutton', { name: 'Số lượng' });
}
function setQuantity(value: string) {
  fireEvent.change(quantityInput(), { target: { value } });
}
function addButton(name = 'Thêm vào giỏ') {
  return screen.getByRole('button', { name });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Mounts without touching storage, so a second mount reads what the first one saved.
async function mountDetail(badgeTotal: number) {
  render(<ShopProvider><ProductDetail id="cappuccino" /></ShopProvider>);
  await screen.findByRole('heading', { name: 'Cappuccino' });
  await screen.findByRole('link', { name: `Giỏ hàng (${badgeTotal})` });
}
async function renderDetail(stock = 30, cart: CartLine[] = []) {
  localStorage.setItem('brewlite-cart', JSON.stringify(cart));
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
    const body = path === '/products/cappuccino' ? { ...product, stock }
      : path === '/catalog/options' ? options : null;
    if (!body) throw new Error(`Unexpected request: ${path}`);
    return new Response(JSON.stringify(body), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }));
  await mountDetail(cart.reduce((sum, line) => sum + line.quantity, 0));
}

describe('ProductDetail quantity and stock', () => {
  it('P1-UI-01: adds two Cappuccino L with pearl and updates the badge', async () => {
    await renderDetail();
    fireEvent.click(screen.getByRole('radio', { name: /^L / }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Trân châu / }));
    setQuantity('2');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (2)' });
    await waitFor(() => expect(readCart()).toEqual([makeLine(2, 'L', ['Trân châu'])]));
    expect(screen.getAllByText('62.000đ', { exact: true })).toHaveLength(1);
  });

  it('P1-UI-02: caps stock across all variants of the product', async () => {
    const initial = [makeLine(2, 'M'), makeLine(3, 'L', ['Trân châu'])];
    await renderDetail(5, initial);
    const add = addButton();
    expect(add).toBeDisabled();
    expect(screen.getByText(LIMIT, { exact: true })).toBeInTheDocument();
    fireEvent.click(add);
    expect(readCart()).toEqual(initial);
  });

  it.each(['', '0', '-1', '1.5', '6', '100'])('P1-UI-08: rejects quantity "%s"', async (value) => {
    await renderDetail(5);
    setQuantity(value);
    expect(quantityInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Số lượng phải là số nguyên từ 1 đến 5')).toBeInTheDocument();
    const add = addButton();
    expect(add).toBeDisabled();
    fireEvent.click(add);
    expect(readCart()).toEqual([]);
  });
});

describe('ProductDetail quantity edge cases', () => {
  it('P1-UI-03: locks the picker when stock is 0', async () => {
    await renderDetail(0);
    const add = addButton('Hết hàng');
    expect(add).toBeDisabled();
    expect(quantityInput()).toBeDisabled();
    expect(screen.getByText(LIMIT, { exact: true })).toBeInTheDocument();
    fireEvent.click(add);
    expect(readCart()).toEqual([]);
  });

  it('P1-UI-04: adds only the last unit left across variants, then locks', async () => {
    await renderDetail(5, [makeLine(2, 'L'), makeLine(2, 'S')]);
    expect(quantityInput()).toHaveAttribute('max', '1');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (5)' });
    await waitFor(() => expect(readCart()).toEqual([makeLine(2, 'L'), makeLine(2, 'S'), makeLine(1)]));
    expect(addButton()).toBeDisabled();
    expect(screen.getByText(LIMIT, { exact: true })).toBeInTheDocument();
  });

  it('P1-UI-05: stops the selected line at 99 cups', async () => {
    await renderDetail(150, [makeLine(98)]);
    expect(quantityInput()).toHaveAttribute('max', '1');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (99)' });
    await waitFor(() => expect(readCart()).toEqual([makeLine(99)]));
    expect(addButton()).toBeDisabled();
    expect(screen.getByText(LIMIT, { exact: true })).toBeInTheDocument();
  });

  it('P1-UI-06: recalculates the quota for a new size', async () => {
    await renderDetail(150, [makeLine(98)]);
    fireEvent.click(screen.getByRole('radio', { name: /^L / }));
    expect(quantityInput()).toHaveValue(1);
    expect(quantityInput()).toHaveAttribute('max', '52');
    expect(addButton()).toBeEnabled();
    setQuantity('2');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (100)' });
    await waitFor(() => expect(readCart()).toEqual([makeLine(98), makeLine(2, 'L')]));
  });

  it('P1-UI-07: ignores quantities of other products', async () => {
    const americano = makeLine(99, 'M', [], 'americano');
    await renderDetail(5, [americano]);
    expect(quantityInput()).toHaveAttribute('max', '5');
    setQuantity('5');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (104)' });
    await waitFor(() => expect(readCart()).toEqual([americano, makeLine(5)]));
  });

  it('P1-UI-09: clears the error once the quantity is fixed', async () => {
    await renderDetail(5);
    setQuantity('6');
    expect(screen.getByText('Số lượng phải là số nguyên từ 1 đến 5')).toBeInTheDocument();
    setQuantity('2');
    expect(screen.queryByText('Số lượng phải là số nguyên từ 1 đến 5')).not.toBeInTheDocument();
    expect(quantityInput()).toHaveAttribute('aria-invalid', 'false');
    expect(addButton()).toBeEnabled();
    fireEvent.click(addButton());
    await waitFor(() => expect(readCart()).toEqual([makeLine(2)]));
  });

  it('P1-UI-10: keeps the typed value and re-checks it against the new quota', async () => {
    await renderDetail(5);
    setQuantity('4');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (4)' });
    expect(quantityInput()).toHaveValue(4);
    expect(screen.getByText('Số lượng phải là số nguyên từ 1 đến 1')).toBeInTheDocument();
    expect(addButton()).toBeDisabled();
    setQuantity('1');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (5)' });
    await waitFor(() => expect(readCart()).toEqual([makeLine(5)]));
    expect(addButton()).toBeDisabled();
    expect(screen.getByText(LIMIT, { exact: true })).toBeInTheDocument();
  });

  it('P1-UI-11: stays locked without a negative max when the cart exceeds stock', async () => {
    const initial = [makeLine(5)];
    await renderDetail(3, initial);
    expect(quantityInput()).not.toHaveAttribute('max');
    expect(quantityInput()).toBeDisabled();
    expect(addButton()).toBeDisabled();
    expect(screen.getByText(LIMIT, { exact: true })).toBeInTheDocument();
    fireEvent.click(addButton());
    expect(readCart()).toEqual(initial);
  });

  it('P1-UI-12: refuses a 21st line with the exact message', async () => {
    const initial = otherLines(20);
    await renderDetail(30, initial);
    fireEvent.click(addButton());
    expect(await screen.findByText('Giỏ hàng tối đa 20 món', { exact: true })).toBeInTheDocument();
    expect(readCart()).toEqual(initial);
  });

  it('P1-UI-13: still merges into an existing line when the cart has 20 lines', async () => {
    const others = otherLines(19);
    await renderDetail(30, [makeLine(1), ...others]);
    setQuantity('2');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (22)' });
    await waitFor(() => expect(readCart()).toEqual([makeLine(3), ...others]));
    expect(screen.queryByText('Giỏ hàng tối đa 20 món')).not.toBeInTheDocument();
  });

  it('P1-UI-14: treats topping order as the same line for the 99 cap', async () => {
    const existing = makeLine(98, 'M', ['Kem phô mai', 'Trân châu']);
    await renderDetail(150, [existing]);
    fireEvent.click(screen.getByRole('checkbox', { name: /^Trân châu / }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Kem phô mai / }));
    expect(quantityInput()).toHaveAttribute('max', '1');
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (99)' });
    await waitFor(() => expect(readCart()).toEqual([{ ...existing, quantity: 99 }]));
  });

  it('P1-UI-15: adds one by default and keeps the cart after remounting', async () => {
    await renderDetail();
    expect(quantityInput()).toHaveValue(1);
    fireEvent.click(addButton());
    await screen.findByRole('link', { name: 'Giỏ hàng (1)' });
    cleanup();
    await mountDetail(1);
    expect(readCart()).toEqual([makeLine(1)]);
  });

  it('P1-UI-16: resets quantity and notice when size or topping changes', async () => {
    await renderDetail(30, [makeLine(2, 'L')]);
    setQuantity('3');
    fireEvent.click(addButton());
    await screen.findByText('Đã thêm vào giỏ hàng');
    fireEvent.click(screen.getByRole('radio', { name: /^L / }));
    expect(quantityInput()).toHaveValue(1);
    expect(quantityInput()).toHaveAttribute('max', '25');
    expect(screen.getByText('55.000đ', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('Đã thêm vào giỏ hàng')).not.toBeInTheDocument();
    setQuantity('2');
    fireEvent.click(addButton());
    await screen.findByText('Đã thêm vào giỏ hàng');
    fireEvent.click(screen.getByRole('checkbox', { name: /^Trân châu / }));
    expect(quantityInput()).toHaveValue(1);
    expect(quantityInput()).toHaveAttribute('max', '23');
    expect(screen.getByText('62.000đ', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('Đã thêm vào giỏ hàng')).not.toBeInTheDocument();
  });
});
