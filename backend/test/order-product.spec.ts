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

    // key ngẫu nhiên dài vài nghìn ký tự làm chỉ số unique của Postgres từ chối → 500 (đã tái hiện trên compose); chặn ở biên API
    it('key dài hơn 255 ký tự → 400 Idempotency-Key too long, không tạo đơn; đúng 255 vẫn được', async () => {
      const { or, svc } = await setup();
      await expect(svc.create('u1', dto, 'k'.repeat(256))).rejects.toThrow('Idempotency-Key too long');
      expect(await or.findByUserId('u1')).toHaveLength(0);
      await expect(svc.create('u1', dto, 'k'.repeat(255))).resolves.toMatchObject({ isCached: false });
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

  // GET /orders/me: mỗi dòng món kèm productName (cùng cách listQueue), để lịch sử hiện tên món thay vì mã
  describe('listMine kèm productName', () => {
    async function setup() {
      const pr = new InMemoryProductRepo();
      await pr.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 1 });
      await pr.save({ id: 'p2', name: 'Cold Brew', price: 40000, stock: 10, version: 1 });
      const or = new InMemoryOrderRepo();
      return { or, svc: new OrderService(or, pr) };
    }

    it('đơn một món: items[0].productName là tên món', async () => {
      const { svc } = await setup();
      await svc.create('u1', { items: [{ productId: 'p1', quantity: 2 }] });
      const [o] = await svc.listMine('u1');
      expect(o.items).toHaveLength(1);
      expect(o.items[0].productName).toBe('Latte');
      expect(o.items[0].productId).toBe('p1');
    });

    it('đơn nhiều món: mỗi dòng có tên đúng món của nó, thứ tự dòng giữ nguyên', async () => {
      const { svc } = await setup();
      await svc.create('u1', {
        items: [
          { productId: 'p2', quantity: 1 },
          { productId: 'p1', quantity: 3 },
          { productId: 'p2', quantity: 1, size: 'L' },
        ],
      });
      const [o] = await svc.listMine('u1');
      expect(o.items.map((i) => i.productName)).toEqual(['Cold Brew', 'Latte', 'Cold Brew']);
    });

    it('món không còn trong DB: productName rơi về productId, không ném lỗi', async () => {
      const { or, svc } = await setup();
      await or.save({
        id: 'o-gone',
        userId: 'u1',
        status: OrderStatus.PAID,
        total: 10000,
        items: [
          { productId: 'p1', quantity: 1, unitPrice: 35000, size: 'M', toppings: [] },
          { productId: 'p-deleted', quantity: 1, unitPrice: 10000, size: 'M', toppings: [] },
        ],
        createdAt: new Date(),
      });
      const [o] = await svc.listMine('u1');
      expect(o.items.map((i) => i.productName)).toEqual(['Latte', 'p-deleted']);
    });

    it('vẫn chỉ đơn của chính user, mới nhất trước; không đổi các trường khác của đơn', async () => {
      const { or, svc } = await setup();
      const a = await svc.create('u1', { items: [{ productId: 'p1', quantity: 1 }] });
      await svc.create('u2', { items: [{ productId: 'p2', quantity: 1 }] });
      const mine = await svc.listMine('u1');
      expect(mine.map((o) => o.id)).toEqual([a.id]);
      const { items: _items, ...rest } = mine[0];
      const { items: _raw, ...stored } = (await or.findByUserId('u1'))[0];
      expect(rest).toEqual(stored);
    });

    it('tra tên các món song song, mỗi productId phân biệt đúng một lần (không N+1 tuần tự)', async () => {
      const { or, svc } = await setup();
      const pr = new InMemoryProductRepo();
      for (const [id, name] of [['p1', 'Latte'], ['p2', 'Cold Brew'], ['p3', 'Matcha']]) {
        await pr.save({ id, name, price: 30000, stock: 10, version: 1 });
      }
      // findById trễ một nhịp: đếm số lời gọi đang chạy cùng lúc và số lần gọi theo từng productId
      let inFlight = 0;
      let maxInFlight = 0;
      const calls: string[] = [];
      const realFind = pr.findById.bind(pr);
      pr.findById = async (id, tx) => {
        calls.push(id);
        maxInFlight = Math.max(maxInFlight, ++inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return realFind(id, tx);
      };
      const svc2 = new OrderService(or, pr);
      const line = (productId: string) => ({ productId, quantity: 1, unitPrice: 30000, size: 'M', toppings: [] });
      await or.save({
        id: 'o-many',
        userId: 'u9',
        status: OrderStatus.PAID,
        total: 30000 * 5,
        items: [line('p1'), line('p2'), line('p1'), line('p3'), line('p2')],
        createdAt: new Date(),
      });

      const [o] = await svc2.listMine('u9');

      expect(o.items.map((i) => i.productName)).toEqual(['Latte', 'Cold Brew', 'Latte', 'Matcha', 'Cold Brew']);
      expect([...calls].sort()).toEqual(['p1', 'p2', 'p3']);
      expect(maxInFlight).toBe(3);
    });

    it('GET /orders/:id không đổi: items vẫn không có productName', async () => {
      const { svc } = await setup();
      const a = await svc.create('u1', { items: [{ productId: 'p1', quantity: 1 }] });
      const got = await svc.getById('u1', a.id);
      expect(got.items[0]).not.toHaveProperty('productName');
    });
  });
});
