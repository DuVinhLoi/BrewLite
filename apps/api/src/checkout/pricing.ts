import { BadRequestException } from '@nestjs/common';

export const sizes = { S: 0, M: 5000, L: 10000 };
export const toppings = { 'Trân châu': 7000, 'Kem phô mai': 10000, 'Thạch dừa': 5000 };
export type Size = keyof typeof sizes;
export type Topping = keyof typeof toppings;
export type ItemInput = { productId: string; size: Size; toppings: Topping[]; quantity: number };

export function invalid(message: string): never {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message, details: [message] });
}
export function record(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Body phải là object');
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !allowed.includes(key))) invalid('Body chứa trường không được phép');
  return result;
}
export function unitPrice(price: number, size: Size, selected: Topping[]): number {
  return price + sizes[size] + selected.reduce((sum, name) => sum + toppings[name], 0);
}
export function parseItems(body: unknown): ItemInput[] {
  const { items } = record(body, ['items']);
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) invalid('items phải có từ 1 đến 20 dòng');
  return items.map((value) => {
    const item = record(value, ['productId', 'size', 'toppings', 'quantity']);
    if (typeof item.productId !== 'string' || !item.productId || item.productId.length > 100) invalid('productId không hợp lệ');
    if (typeof item.size !== 'string' || !Object.hasOwn(sizes, item.size)) invalid('size phải là S, M hoặc L');
    if (!Array.isArray(item.toppings) || item.toppings.length > 3 ||
      item.toppings.some((name) => typeof name !== 'string' || !Object.hasOwn(toppings, name)) ||
      new Set(item.toppings).size !== item.toppings.length) invalid('toppings không hợp lệ hoặc trùng lặp');
    if (!Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99) invalid('quantity phải là số nguyên từ 1 đến 99');
    return item as ItemInput;
  });
}