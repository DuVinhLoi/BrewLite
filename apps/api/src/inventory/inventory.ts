import { Prisma, type Ingredient } from '@prisma/client';
import { invalid, type ItemInput } from '../checkout/pricing';

// Enough significant digits for numeric(18,3) recipes × all 20 cart lines.
Prisma.Decimal.set({ precision: 40 });

type RecipeData = { id: string; productId: string | null; size: string | null; topping: string | null; lines: { ingredientId: string; quantity: Prisma.Decimal }[] };
type Shortage = { ingredientId: string; name: string; unit: string; requested: string; available: string };
type Availability = { productId: string; size: string; toppings: string[]; quantity: number; cups: number; sellable: boolean; limitingIngredients: { id: string; name: string; unit: string }[]; reason?: string };

export function canonicalQuantity(value: unknown, unit: unknown, canonical: string, allowZero = false): Prisma.Decimal {
  if (typeof value !== 'string' || !/^\d{1,15}(\.\d{1,3})?$/.test(value)) invalid('Định lượng phải là chuỗi số thập phân, tối đa 3 chữ số sau dấu chấm');
  const factor = unit === canonical ? 1 : (unit === 'kg' && canonical === 'g') || (unit === 'l' && canonical === 'ml') ? 1000 : 0;
  if (!factor) invalid('Đơn vị không tương thích với nguyên liệu');
  const quantity = new Prisma.Decimal(value).mul(factor);
  if (quantity.lt(0) || (!allowZero && quantity.isZero()) || quantity.gt('999999999999999.999')) invalid('Định lượng nằm ngoài giới hạn hợp lệ');
  if (canonical === 'piece' && !quantity.isInteger()) invalid('Nguyên liệu tính bằng miếng/cái phải là số nguyên');
  return quantity;
}

export function calculateAvailability(items: ItemInput[], recipes: RecipeData[], ingredients: Ingredient[]) {
  const inventory = new Map(ingredients.map((i) => [i.id, i]));
  const demand = new Map<string, Prisma.Decimal>();
  const lines: Availability[] = items.map((item) => {
    const base = recipes.find((r) => r.productId === item.productId && r.size === item.size);
    const selected = [base, ...item.toppings.map((name) => recipes.find((r) => r.topping === name))];
    const result: Availability = { ...item, cups: 0, sellable: false, limitingIngredients: [] };
    if (selected.some((recipe) => !recipe?.lines.length) || !base?.lines.some((line) => inventory.get(line.ingredientId)?.tracked)) {
      return { ...result, reason: 'Chưa có công thức hợp lệ cho lựa chọn này' };
    }
    const perCup = new Map<string, Prisma.Decimal>();
    for (const recipe of selected) {
      for (const line of recipe!.lines) {
        const ingredient = inventory.get(line.ingredientId);
        if (!ingredient || line.quantity.lte(0)) return { ...result, reason: 'Công thức chứa nguyên liệu hoặc định lượng không hợp lệ' };
        if (ingredient.tracked) perCup.set(ingredient.id, (perCup.get(ingredient.id) ?? new Prisma.Decimal(0)).add(line.quantity));
      }
    }
    const capacities = [...perCup].map(([id, quantity]) => {
      const ingredient = inventory.get(id)!;
      const available = Prisma.Decimal.max(0, ingredient.onHand.sub(ingredient.reserved));
      return { ingredient, cups: Math.min(Number.MAX_SAFE_INTEGER, available.div(quantity).floor().toNumber()) };
    });
    result.cups = Math.min(...capacities.map((c) => c.cups));
    result.sellable = result.cups > 0;
    result.limitingIngredients = capacities.filter((c) => c.cups === result.cups).map(({ ingredient: { id, name, unit } }) => ({ id, name, unit }));
    for (const [id, quantity] of perCup) demand.set(id, (demand.get(id) ?? new Prisma.Decimal(0)).add(quantity.mul(item.quantity)));
    return result;
  });
  const shortages: Shortage[] = [];
  for (const [id, quantity] of [...demand].sort(([a], [b]) => a.localeCompare(b))) {
    const ingredient = inventory.get(id)!;
    const available = ingredient.onHand.sub(ingredient.reserved);
    if (quantity.gt(available)) shortages.push({ ingredientId: id, name: ingredient.name, unit: ingredient.unit, requested: quantity.toString(), available: available.toString() });
  }
  return { demand, response: { canOrder: lines.every((line) => line.sellable) && shortages.length === 0, lines, shortages } };
}
