import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import type { Product } from '@/lib/api';
import type { Availability, InventoryItem } from '@/lib/inventory';
import type { CartLine, Order, Payment } from '@/lib/shop';
import { ShopProvider } from '@/components/shop/ShopProvider';

export const product: Product = { id: 'cappuccino', name: 'Cappuccino', description: 'Cà phê sữa nóng', price: 45000, imageUrl: '/coffee.jpg', stock: 8 };
export const options = { sizes: { S: 0, M: 5000, L: 10000 }, toppings: { 'Trân châu': 7000, 'Kem phô mai': 10000 } };
export const line: CartLine = { key: '["cappuccino","L",["Trân châu"]]', productId: 'cappuccino', name: 'Cappuccino', size: 'L', toppings: ['Trân châu'], quantity: 2, unitPrice: 62000 };
export const session = { token: 'fake-test-token', email: 'test@example.invalid', role: 'CUSTOMER' };
export const order: Order = { id: 'order-1', status: 'PENDING', total: 124000, createdAt: '2026-11-04T03:00:00Z', items: [{ ...line, id: 'item-1', lineTotal: 124000 }], payments: [] };
export const payment: Payment = { id: 'payment-1', method: 'WALLET', status: 'PENDING', amount: 124000, createdAt: '2026-11-04T03:00:00Z', paymentUrl: 'https://sandbox.example.invalid/pay', expiresAt: '2099-01-01T00:00:00Z', gatewayResponseCode: null, gatewayTransactionStatus: null };

export function available(items: InventoryItem[], cups = 8): Availability {
  return { canOrder: true, lines: items.map((item) => ({ ...item, cups, sellable: true, limitingIngredients: [{ id: 'milk', name: 'Sữa', unit: 'ml' }] })), shortages: [] };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function mockApi(handler: (path: string, init: RequestInit) => Response | Promise<Response>) {
  return vi.mocked(fetch).mockImplementation(async (input, init = {}) => handler(new URL(String(input)).pathname, init));
}

export function availabilityApi() {
  return mockApi((path, init) => {
    if (path !== '/inventory/availability') throw new Error(`Unexpected path: ${path}`);
    const { items } = JSON.parse(String(init.body)) as { items: InventoryItem[] };
    return json(available(items));
  });
}

export function renderShop(children: ReactNode, cart: CartLine[] = [], loggedIn = false) {
  localStorage.setItem('brewlite-cart', JSON.stringify(cart));
  if (loggedIn) sessionStorage.setItem('brewlite-session', JSON.stringify(session));
  return render(<ShopProvider>{children}</ShopProvider>);
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
