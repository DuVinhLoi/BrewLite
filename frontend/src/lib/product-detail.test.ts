import { afterEach, expect, test, vi } from 'vitest';
import * as api from './api';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test('product detail calls real endpoint with encoded ID and normalizes data', async () => {
  const fetchMock = vi.fn().mockResolvedValue(json(200, { id: 'a/b', name: 'Latte', price: 30000, stock: 0, version: 2, imageUrl: '/images/latte.svg' }));
  vi.stubGlobal('fetch', fetchMock);
  const product = await api.getProduct('a/b');
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/products\/a%2Fb$/);
  expect(fetchMock.mock.calls[0][1]).toEqual({ cache: 'no-store' });
  expect(product).toEqual({ id: 'a/b', name: 'Latte', price: 30000, stock: 0, version: 2, imageUrl: '/images/latte.svg' });
});

test.each([404, 500])('product detail HTTP %i remains an error without mock fallback', async (status) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(status, { message: 'error' })));
  await expect(api.getProduct('missing')).rejects.toMatchObject({ status });
});

test('product detail network failure reports connection error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
  await expect(api.getProduct('p1')).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/kết nối/) });
});
