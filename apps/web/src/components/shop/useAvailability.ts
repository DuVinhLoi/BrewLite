'use client';
import { useEffect, useState } from 'react';
import { checkAvailability, type Availability, type InventoryItem } from '@/lib/inventory';
import { cartKey } from '@/lib/shop';

export function useAvailability(items: InventoryItem[], revision = 0) {
  const key = JSON.stringify(items.map(({ productId, size, toppings, quantity }) => ({ productId, size, toppings, quantity })));
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${revision}:${attempt}:${key}`;
  const [state, setState] = useState<{ key: string; result?: Availability; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const choices: InventoryItem[] = JSON.parse(key);
    if (choices.length) {
      checkAvailability(choices, controller.signal).then((result) => {
        if (!controller.signal.aborted) setState({ key: requestKey, result });
      }).catch((error: Error) => {
        if (!controller.signal.aborted) setState({ key: requestKey, error: error.message });
      });
    }
    return () => controller.abort();
  }, [key, requestKey]);
  const current = state?.key === requestKey ? state : null;
  return { result: current?.result, error: current?.error, loading: items.length > 0 && !current, retry: () => setAttempt((value) => value + 1) };
}

// Find the additional quantity that fits alongside every existing cart line.
export function useRemainingQuantity(cart: InventoryItem[], selection: InventoryItem, limit: number, enabled: boolean) {
  const key = JSON.stringify({ cart, selection, limit, enabled });
  const [state, setState] = useState<{ key: string; remaining: number; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const { cart, selection, limit, enabled } = JSON.parse(key) as { cart: InventoryItem[]; selection: InventoryItem; limit: number; enabled: boolean };
    async function calculate() {
      let low = 0;
      const selectedKey = cartKey(selection.productId, selection.size, selection.toppings);
      const existing = cart.findIndex((item) => cartKey(item.productId, item.size, item.toppings) === selectedKey);
      let high = enabled && (existing >= 0 || cart.length < 20)
        ? Math.max(0, Math.min(limit, 99 - (cart[existing]?.quantity ?? 0))) : 0;
      try {
        while (low < high && !controller.signal.aborted) {
          const extra = Math.ceil((low + high) / 2);
          const items = existing >= 0
            ? cart.map((item, index) => index === existing ? { ...item, quantity: item.quantity + extra } : item)
            : [...cart, { ...selection, quantity: extra }];
          const result = await checkAvailability(items, controller.signal);
          if (result.canOrder) low = extra;
          else high = extra - 1;
        }
        if (!controller.signal.aborted) setState({ key, remaining: low });
      } catch (error) {
        if (!controller.signal.aborted) setState({ key, remaining: 0, error: (error as Error).message });
      }
    }
    void calculate();
    return () => controller.abort();
  }, [key]);
  const current = state?.key === key ? state : null;
  return { remaining: current?.remaining ?? 0, loading: !current, error: current?.error };
}
