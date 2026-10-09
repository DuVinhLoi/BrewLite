import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { OrderController } from '../src/order/order.controller';
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

  // Đề §9 tiêu chí (b): gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn
  describe('POST /orders Idempotency-Key', () => {
    const setup = async () => {
      const pr = new InMemoryProductRepo();
      await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
      const or = new InMemoryOrderRepo();
      return { or, svc: new OrderService(or, pr) };
    };
    const dto = { items: [{ productId: 'p1', quantity: 1 }] };

    it('cùng key, cùng người → trả lại đúng đơn cũ (isCached), kho chỉ có 1 đơn', async () => {
      const { or, svc } = await setup();
      const a = await svc.create('u1', dto, 'K1');
      const b = await svc.create('u1', dto, 'K1');
      expect(a.isCached).toBe(false);
      expect(b.isCached).toBe(true);
      expect(b.id).toBe(a.id);
      expect(await or.findByUserId('u1')).toHaveLength(1);
    });

    it('key của người khác → 422, không tạo đơn, không lộ đơn của họ', async () => {
      const { or, svc } = await setup();
      await svc.create('u1', dto, 'K2');
      await expect(svc.create('u2', dto, 'K2')).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(await or.findByUserId('u2')).toHaveLength(0);
    });

    it('không có key → mỗi lần một đơn mới (như cũ)', async () => {
      const { or, svc } = await setup();
      const a = await svc.create('u1', dto);
      const b = await svc.create('u1', dto);
      expect(b.id).not.toBe(a.id);
      expect(await or.findByUserId('u1')).toHaveLength(2);
    });

    it('2 request song song cùng key → vẫn chỉ 1 đơn, cùng id', async () => {
      const { or, svc } = await setup();
      const [a, b] = await Promise.all([svc.create('u1', dto, 'K3'), svc.create('u1', dto, 'K3')]);
      expect(b.id).toBe(a.id);
      expect([a.isCached, b.isCached].sort()).toEqual([false, true]);
      expect(await or.findByUserId('u1')).toHaveLength(1);
    });

    it('controller: 201 khi tạo mới, 200 khi trả lại đơn cũ; header idempotency-key được chuyển xuống service', async () => {
      const { svc } = await setup();
      const ctl = new OrderController(svc);
      const status: number[] = [];
      const res = { status: (c: number) => status.push(c) };
      const req = { user: { id: 'u1' } };
      const a = await ctl.create(dto, 'K4', req, res);
      const b = await ctl.create(dto, 'K4', req, res);
      expect(b.id).toBe(a.id);
      expect(status).toEqual([201, 200]);
    });
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
