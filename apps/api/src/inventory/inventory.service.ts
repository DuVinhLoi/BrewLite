import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { type Identity } from '../auth/auth.service';
import { invalid, parseItems, record, sizes, toppings, type ItemInput } from '../checkout/pricing';
import { PrismaService } from '../prisma/prisma.service';
import { calculateAvailability, canonicalQuantity } from './inventory';

const recipeInclude = { lines: { include: { ingredient: { select: { id: true, name: true, unit: true, tracked: true } } } } } satisfies Prisma.RecipeInclude;
const transactionOptions = { maxWait: 20000, timeout: 20000 };

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private staff(user: Identity) {
    if (user.role !== 'BARISTA') throw new ForbiddenException();
  }

  private balance(ingredient: { id: string; name: string; unit: string; tracked: boolean; onHand: Prisma.Decimal; reserved: Prisma.Decimal }) {
    return { ...ingredient, onHand: ingredient.onHand.toString(), reserved: ingredient.reserved.toString(), available: ingredient.onHand.sub(ingredient.reserved).toString() };
  }

  async ingredients(user: Identity) {
    this.staff(user);
    return (await this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } })).map((i) => this.balance(i));
  }

  async movements(user: Identity) {
    this.staff(user);
    return this.prisma.stockMovement.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100, include: { actor: { select: { email: true } }, ingredient: { select: { name: true, unit: true } } } });
  }

  async move(user: Identity, id: string, body: unknown) {
    this.staff(user);
    const input = record(body, ['kind', 'quantity', 'unit', 'reason']);
    if (input.kind !== 'RECEIVE' && input.kind !== 'ADJUST') invalid('kind phải là RECEIVE hoặc ADJUST');
    if (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.trim().length > 500) invalid('Cần lý do từ 1 đến 500 ký tự');
    const reason = input.reason.trim();
    const kind = input.kind;
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM ingredients WHERE id = ${id} FOR UPDATE`;
      const ingredient = await tx.ingredient.findUnique({ where: { id } });
      if (!ingredient) throw new NotFoundException({ code: 'INGREDIENT_NOT_FOUND', message: 'Không tìm thấy nguyên liệu' });
      const quantity = canonicalQuantity(input.quantity, input.unit, ingredient.unit, kind === 'ADJUST');
      const onHand = kind === 'ADJUST' ? quantity : ingredient.onHand.add(quantity);
      if (onHand.gt('999999999999999.999')) invalid('Tồn kho vượt giới hạn hợp lệ');
      if (onHand.lt(ingredient.reserved)) throw new ConflictException({ code: 'BELOW_RESERVED', message: 'Tồn kiểm kê không được thấp hơn lượng đang giữ' });
      await tx.stockMovement.create({ data: { ingredientId: id, actorId: user.sub, kind, quantity: onHand.sub(ingredient.onHand), onHandAfter: onHand, reason } });
      return this.balance(await tx.ingredient.update({ where: { id }, data: { onHand } }));
    }, transactionOptions);
  }

  async recipes(user: Identity) {
    this.staff(user);
    return this.prisma.recipe.findMany({ orderBy: { id: 'asc' }, include: recipeInclude });
  }

  async saveRecipe(user: Identity, body: unknown) {
    this.staff(user);
    const input = record(body, ['productId', 'size', 'topping', 'lines']);
    const isProduct = typeof input.productId === 'string' && input.productId.length > 0 && input.productId.length <= 100;
    const isTopping = typeof input.topping === 'string' && Object.hasOwn(toppings, input.topping);
    if (isProduct ? input.topping !== undefined || typeof input.size !== 'string' || !Object.hasOwn(sizes, input.size) : !isTopping || input.productId !== undefined || input.size !== undefined) invalid('Chọn sản phẩm và size, hoặc một topping hợp lệ');
    if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > 50) invalid('Công thức cần từ 1 đến 50 nguyên liệu');
    const raw = input.lines.map((line) => record(line, ['ingredientId', 'quantity', 'unit']));
    if (raw.some((line) => typeof line.ingredientId !== 'string' || !line.ingredientId || line.ingredientId.length > 100) || new Set(raw.map((line) => line.ingredientId)).size !== raw.length) invalid('Nguyên liệu không hợp lệ hoặc trùng lặp');
    const productId = input.productId as string;
    const size = input.size as string;
    const topping = input.topping as string;
    return this.prisma.$transaction(async (tx) => {
      // Serialize first creation as well as later replacements of the same selector.
      const selector = isProduct ? JSON.stringify([productId, size]) : JSON.stringify([topping]);
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`recipe:${selector}`}))::text`;
      if (isProduct && !await tx.product.findUnique({ where: { id: productId } })) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm' });
      const ingredients = await tx.ingredient.findMany({ where: { id: { in: raw.map((line) => line.ingredientId as string) } } });
      const lines = raw.map((line) => {
        const ingredient = ingredients.find((i) => i.id === line.ingredientId);
        if (!ingredient) throw new NotFoundException({ code: 'INGREDIENT_NOT_FOUND', message: 'Không tìm thấy nguyên liệu' });
        return { ingredientId: ingredient.id, quantity: canonicalQuantity(line.quantity, line.unit, ingredient.unit) };
      });
      if (isProduct && !ingredients.some((i) => i.tracked)) invalid('Công thức món phải có ít nhất một nguyên liệu quản lý tồn');
      const recipe = await tx.recipe.upsert({ where: isProduct ? { productId_size: { productId, size } } : { topping }, create: isProduct ? { productId, size } : { topping }, update: {} });
      await tx.$queryRaw`SELECT id FROM recipes WHERE id = ${recipe.id} FOR UPDATE`;
      // FK checks also lock ingredients. Acquire those locks in checkout's ID order.
      const ingredientIds = lines.map((line) => line.ingredientId).sort();
      await tx.$queryRaw(Prisma.sql`SELECT id FROM ingredients WHERE id IN (${Prisma.join(ingredientIds)}) ORDER BY id FOR KEY SHARE`);
      await tx.recipeLine.deleteMany({ where: { recipeId: recipe.id } });
      return tx.recipe.update({ where: { id: recipe.id }, data: { lines: { create: lines } }, include: recipeInclude });
    }, transactionOptions);
  }

  async evaluate(tx: Prisma.TransactionClient, items: ItemInput[], lock = false) {
    const where: Prisma.RecipeWhereInput = { OR: [
      ...items.map(({ productId, size }) => ({ productId, size })),
      { topping: { in: [...new Set(items.flatMap((i) => i.toppings))] } },
    ] };
    if (lock) {
      const ids = (await tx.recipe.findMany({ where, select: { id: true }, orderBy: { id: 'asc' } })).map((r) => r.id);
      if (ids.length) await tx.$queryRaw(Prisma.sql`SELECT id FROM recipes WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR SHARE`);
    }
    const recipes = await tx.recipe.findMany({ where, include: { lines: true } });
    const ids = [...new Set(recipes.flatMap((r) => r.lines.map((line) => line.ingredientId)))].sort();
    if (lock && ids.length) await tx.$queryRaw(Prisma.sql`SELECT id FROM ingredients WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`);
    const ingredients = await tx.ingredient.findMany({ where: { id: { in: ids } } });
    return calculateAvailability(items, recipes, ingredients);
  }

  async availability(body: unknown) {
    const items = parseItems(body);
    return this.prisma.$transaction(async (tx) => {
      const ids = [...new Set(items.map((i) => i.productId))];
      if (await tx.product.count({ where: { id: { in: ids } } }) !== ids.length) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm' });
      return (await this.evaluate(tx, items)).response;
    }, { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async reserve(tx: Prisma.TransactionClient, items: ItemInput[]) {
    const { demand, response } = await this.evaluate(tx, items, true);
    if (response.lines.some((line) => line.reason)) throw new ConflictException({ code: 'RECIPE_UNAVAILABLE', message: 'Chưa có công thức hợp lệ cho lựa chọn này', details: response.lines.filter((line) => line.reason) });
    if (!response.canOrder) throw new ConflictException({ code: 'OUT_OF_STOCK', message: 'Không đủ nguyên liệu cho giỏ hàng. Vui lòng giảm số lượng hoặc đổi món.', details: response.shortages });
    const snapshot = [...demand].sort(([a], [b]) => a.localeCompare(b)).map(([ingredientId, quantity]) => ({ ingredientId, quantity }));
    for (const line of snapshot) await tx.ingredient.update({ where: { id: line.ingredientId }, data: { reserved: { increment: line.quantity } } });
    return snapshot;
  }

  async settle(tx: Prisma.TransactionClient, orderId: string, consume: boolean) {
    const lines = await tx.orderIngredient.findMany({ where: { orderId }, orderBy: { ingredientId: 'asc' } });
    if (!lines.length) throw new ConflictException({ code: 'INVENTORY_SNAPSHOT_MISSING', message: 'Đơn thiếu snapshot nguyên liệu; cần nhân viên kiểm tra' });
    const ids = lines.map((line) => line.ingredientId);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM ingredients WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`);
    for (const line of lines) {
      const changed = await tx.ingredient.updateMany({ where: { id: line.ingredientId, reserved: { gte: line.quantity }, ...(consume ? { onHand: { gte: line.quantity } } : {}) }, data: { reserved: { decrement: line.quantity }, ...(consume ? { onHand: { decrement: line.quantity } } : {}) } });
      if (changed.count !== 1) throw new ConflictException({ code: 'INVENTORY_INCONSISTENT', message: 'Lượng giữ nguyên liệu không nhất quán; cần nhân viên kiểm tra' });
    }
  }
}
