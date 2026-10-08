import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from '../src/product/product.service';
import { OrderService } from '../src/order/order.service';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { OrderStatus } from '../src/contracts/order.contract';

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
