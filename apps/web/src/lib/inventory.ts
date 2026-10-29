import { shopApi, type CartLine } from './shop';

export type Ingredient = { id: string; name: string; unit: 'g' | 'ml' | 'piece'; tracked: boolean; onHand: string; reserved: string; available: string };
export type StockMovement = { id: string; kind: 'RECEIVE' | 'ADJUST'; quantity: string; onHandAfter: string; reason: string; createdAt: string; actor: { email: string }; ingredient: { name: string; unit: string } };
export type InventoryItem = Pick<CartLine, 'productId' | 'size' | 'toppings' | 'quantity'>;
export type AvailabilityLine = InventoryItem & { cups: number; sellable: boolean; limitingIngredients: { id: string; name: string; unit: string }[]; reason?: string };
export type Shortage = { ingredientId: string; name: string; unit: string; requested: string; available: string };
export type Availability = { canOrder: boolean; lines: AvailabilityLine[]; shortages: Shortage[] };

export function checkAvailability(items: InventoryItem[], signal?: AbortSignal): Promise<Availability> {
  return shopApi('/inventory/availability', { method: 'POST', signal, body: JSON.stringify({ items: items.map(({ productId, size, toppings, quantity }) => ({ productId, size, toppings, quantity })) }) });
}

export function shortageMessage(result: Availability): string {
  return result.shortages.map((item) => `${item.name}: cần ${item.requested} ${item.unit}, còn ${item.available} ${item.unit}`).join('; ')
    || result.lines.filter((line) => !line.sellable).map((line) => line.reason ?? 'Hết nguyên liệu').join('; ')
    || 'Không đủ nguyên liệu cho giỏ hàng. Vui lòng giảm số lượng hoặc đổi món.';
}

export function validAmount(value: string, unit: string, allowZero = false): boolean {
  return /^\d+(?:\.\d{1,3})?$/.test(value) && Number.isFinite(Number(value))
    && (allowZero ? Number(value) >= 0 : Number(value) > 0)
    && (unit !== 'piece' || Number.isInteger(Number(value)));
}
