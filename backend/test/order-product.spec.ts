import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from '../src/product/product.service';
import { OrderService } from '../src/order/order.service';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { OrderStatus } from '../src/contracts/order.contract';
import { CreateOrderDto } from '../src/order/dto/create-order.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('products + orders (task 2,6)', () => {
  it('product list excludes stock-0', async () => {
    const pr = new InMemoryProductRepo();
    await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    await pr.save({ id: 'p0', name: 'Empty', price: 1000, stock: 0, version: 1 });
    const svc = new ProductService(pr);
    const list = await svc.listAvailable();
    expect(list.map((p) => p.id)).toEqual(['p1']);
  });

  it('product detail unknown → NotFound', async () => {
    const svc = new ProductService(new InMemoryProductRepo());
    await expect(svc.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('order create computes total server-side from product.price + size/topping; unknown product → 404', async () => {
    const pr = new InMemoryProductRepo();
    await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    const svc = new OrderService(new InMemoryOrderRepo(), pr);
    // client gửi kèm unitPrice giả (0đ) → bị bỏ qua, server tự tính (35.000 + L 10.000 + Trân châu 5.000) * 2
    const o = await svc.create('u1', { items: [{ productId: 'p1', quantity: 2, size: 'L', toppings: ['Trân châu'], unitPrice: 0 } as any] });
    expect(o.total).toBe(100000);
    expect(o.items[0].unitPrice).toBe(50000);
    expect(o.status).toBe(OrderStatus.PENDING);
    expect(o.id).toBeTruthy();
    await expect(svc.create('u1', { items: [{ productId: 'nope', quantity: 1 }] })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('order create: thiếu size → mặc định M (khớp FE + DB default); topping lạ → 400', async () => {
    const pr = new InMemoryProductRepo();
    await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    const svc = new OrderService(new InMemoryOrderRepo(), pr);
    const o = await svc.create('u1', { items: [{ productId: 'p1', quantity: 1 }] });
    expect(o.total).toBe(40000);
    expect(o.items[0].size).toBe('M');
    await expect(svc.create('u1', { items: [{ productId: 'p1', quantity: 1, toppings: ['Vàng'] }] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('order create: topping trùng khóa prototype ("constructor") → 400, không ra total NaN', async () => {
    const pr = new InMemoryProductRepo();
    await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    const svc = new OrderService(new InMemoryOrderRepo(), pr);
    for (const t of ['constructor', 'toString', '__proto__']) {
      await expect(svc.create('u1', { items: [{ productId: 'p1', quantity: 1, toppings: [t] }] })).rejects.toThrow(`Unknown topping: ${t}`);
    }
  });

  it('order create: tổng vượt Int32 → 400 Order total too large (không để Postgres ném 500)', async () => {
    const pr = new InMemoryProductRepo();
    await pr.save({ id: 'big', name: 'Vàng', price: 2_000_000_000, stock: 10, version: 1 });
    const svc = new OrderService(new InMemoryOrderRepo(), pr);
    await expect(svc.create('u1', { items: [{ productId: 'big', quantity: 2 }] })).rejects.toThrow('Order total too large');
  });

  it('CreateOrderDto: quantity tối đa 99 và tối đa 20 dòng', async () => {
    const errs = async (items: object[]) => (await validate(plainToInstance(CreateOrderDto, { items }))).length;
    const line = { productId: 'p1', quantity: 1 };
    expect(await errs([{ ...line, quantity: 99 }])).toBe(0);
    expect(await errs([{ ...line, quantity: 100 }])).toBeGreaterThan(0);
    expect(await errs(Array(20).fill(line))).toBe(0);
    expect(await errs(Array(21).fill(line))).toBeGreaterThan(0);
  });

  it('listMine returns newest-first', async () => {
    const pr = new InMemoryProductRepo();
    await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
    const or = new InMemoryOrderRepo();
    const svc = new OrderService(or, pr);
    const a = await svc.create('u1', { items: [{ productId: 'p1', quantity: 1 }] });
    await new Promise((r) => setTimeout(r, 5));
    const b = await svc.create('u1', { items: [{ productId: 'p1', quantity: 1 }] });
    const mine = await svc.listMine('u1');
    expect(mine.map((o) => o.id)).toEqual([b.id, a.id]);
  });
});
