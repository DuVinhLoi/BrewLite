# Phân hệ Barista + Admin (tồn kho) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay nút "Quầy (demo)" (khách tự tiến đơn) bằng vai trò thật: Barista có màn `/barista` điều khiển `PAID → PREPARING → READY → COMPLETED` và hủy đơn hết nguyên liệu; Admin có màn `/admin` kiểm và điều chỉnh tồn kho sản phẩm.

**Architecture:** Thêm cột `role` vào `User` (vẫn 5 thực thể), đưa `role` vào JWT, thêm `RolesGuard` + decorator `@Roles`. Backend thêm 3 endpoint (`GET /orders?status=`, `GET /admin/products`, `PATCH /admin/products/:id/stock`) và đổi luật `PATCH /orders/:id` theo vai trò; mọi đổi trạng thái vẫn qua `assertTransition`, mọi đổi tồn kho vẫn qua optimistic lock (`version`). Frontend thêm `lib/auth.ts` (đọc role từ JWT để điều hướng/ẩn hiện, server vẫn là nơi chặn quyền), 2 trang `/barista`, `/admin`, bỏ nút "Quầy (demo)".

**Tech Stack:** NestJS 10 + class-validator + @nestjs/jwt, Prisma 5 + PostgreSQL 16, Next.js 14 (app router, client components) + Zustand, Jest 29 (ts-jest), Vitest 3.

## Quyết định đã chốt (grilling 2026-10-09)

| # | Quyết định |
|---|---|
| Q1 | Cột `role` (`CUSTOMER` / `BARISTA` / `ADMIN`) trên `User`, JWT mang `role`, `RolesGuard`, seed `barista@brewlite.vn` / `admin@brewlite.vn` |
| Q2 | `/barista`: 3 cột `PAID` (Chờ pha) / `PREPARING` (Đang pha) / `READY` (Sẵn sàng); nút sang bước kế; nút "Hủy (hết nguyên liệu)" ở cột `PAID` (hoàn tiền + hoàn kho); tự tải lại 5 giây |
| Q3 | `/admin`: chỉ tồn kho `Product.stock` — xem mọi món kể cả hết hàng, đặt số / cộng trừ; **không** CRUD món, **không** bảng nguyên liệu |
| Q4 | Bỏ nút "Quầy (demo)" và quyền khách tự tiến đơn; khách chỉ **hủy** đơn của mình |
| Q5 | Biểu đồ Use Case gốc có Barista + Admin, gắn nhãn "mở rộng ngoài MVP (đề §3.2)", mỗi UC mới có sơ đồ tuần tự |
| Q6 | Làm trên nhánh riêng trước demo; chỉ merge khi test xanh + chạy được trên stack thật |

## Global Constraints

- Nhánh: `feat/barista-admin` tạo từ `develop` **sau khi** 2 file docs người dùng đang sửa dở (`docs/use-case-specifications.md`, `docs/user-sequence-specifications.md`) đã được người dùng commit hoặc cho phép đưa vào commit Task 8. Bước đầu tiên: `git status --short` — còn thay đổi chưa commit thì DỪNG và hỏi người dùng.
- KHÔNG merge, KHÔNG push. Mỗi task 1 commit, message tiếng Việt không dấu hoặc có dấu như các commit trước, cuối message có dòng `Co-Authored-By` theo quy ước phiên đang chạy.
- Đúng 5 thực thể (`User, Product, Order, OrderItem, Payment`); chỉ thêm trường `User.role`, không thêm bảng.
- Mọi đổi trạng thái đơn đi qua `assertTransition` (`backend/src/state-machine/order-state.machine.ts`, KHÔNG sửa bảng `ALLOWED`). Mọi đổi `Product.stock` tăng `version`.
- Quyền chặn ở server (guard + service). Role đọc ở frontend chỉ để điều hướng / ẩn hiện nút.
- Thông điệp hiển thị cho người dùng bằng tiếng Việt; message lỗi của backend giữ tiếng Anh như code hiện có.
- Mật khẩu seed: `barista@brewlite.vn / barista1234`, `admin@brewlite.vn / admin1234`; `demo@brewlite.vn / demo1234` vẫn là `CUSTOMER`.
- Lệnh test: backend `cd backend && npx jest` (hiện 68 pass / 1 skip), frontend `cd frontend && npx vitest run` (hiện 71 pass) + `npx tsc --noEmit` cả hai bên.

## File Structure

| File | Trách nhiệm | Task |
|---|---|---|
| `backend/prisma/schema.prisma` | thêm `User.role` | 1 |
| `backend/prisma/migrations/20261009000000_user_role/migration.sql` (mới) | `ALTER TABLE` thêm cột | 1 |
| `backend/prisma/seed.ts` | seed barista + admin | 1 |
| `backend/src/contracts/user.contract.ts` | `enum Role`, `UserDto.role`, `type Actor` | 1 |
| `backend/src/prisma/prisma-user.repo.ts` | đọc/ghi `role` | 1 |
| `backend/src/auth/auth.service.ts`, `jwt-auth.guard.ts` | `role` trong JWT và `req.user` | 1 |
| `backend/src/auth/roles.decorator.ts`, `roles.guard.ts` (mới) | `@Roles(...)` + kiểm vai trò | 1 |
| `backend/src/contracts/order.contract.ts` | `findByStatuses` | 2 |
| `backend/src/stubs/in-memory-order.repo.ts`, `backend/src/prisma/prisma-order.repo.ts` | hiện thực `findByStatuses` | 2 |
| `backend/src/order/order.service.ts`, `order.controller.ts` | `listQueue` + `GET /orders?status=` | 2 |
| `backend/src/payment/payment.service.ts`, `payment.controller.ts` | luật PATCH theo vai trò | 3 |
| `backend/src/contracts/product.contract.ts`, 2 product repo | `findAll`, `setStockWithOptimisticLock` | 4 |
| `backend/src/product/admin-product.controller.ts`, `dto/adjust-stock.dto.ts` (mới), `product.service.ts`, `product.module.ts` | API tồn kho admin | 4 |
| `frontend/src/lib/auth.ts` (mới) | token, đọc role, trang chủ theo role | 5 |
| `frontend/src/app/login/page.tsx`, `components/Header.tsx`, `app/history/page.tsx`, `lib/order-status.ts`, `lib/api.ts` | điều hướng theo role, bỏ nút demo | 5 |
| `frontend/Dockerfile`, `docker-compose.yml`, `.env.example` | bỏ `NEXT_PUBLIC_DEMO_COUNTER` | 5 |
| `frontend/src/lib/barista.ts` (mới), `app/barista/page.tsx` (mới) | màn quầy | 6 |
| `frontend/src/lib/admin.ts` (mới), `app/admin/page.tsx` (mới) | màn tồn kho | 7 |
| `docs/*.md`, `README.md` | đồng bộ | 8 |
| `scripts/demo-state-machine.sh` | dùng tài khoản barista | 9 |

---

### Task 1: Vai trò người dùng (Role) trong DB, JWT và guard

**Files:**
- Modify: `backend/prisma/schema.prisma` (model `User`)
- Create: `backend/prisma/migrations/20261009000000_user_role/migration.sql`
- Modify: `backend/prisma/seed.ts`
- Modify: `backend/src/contracts/user.contract.ts`
- Modify: `backend/src/prisma/prisma-user.repo.ts`
- Modify: `backend/src/auth/auth.service.ts`, `backend/src/auth/jwt-auth.guard.ts`, `backend/src/auth/auth.module.ts`
- Create: `backend/src/auth/roles.decorator.ts`, `backend/src/auth/roles.guard.ts`
- Test: `backend/test/auth.spec.ts` (thêm), `backend/test/roles.spec.ts` (mới)

**Interfaces:**
- Produces: `enum Role { CUSTOMER, BARISTA, ADMIN }`, `type Actor = { id: string; role: Role }` (từ `contracts/user.contract.ts`); `req.user: { id, email, role }`; `@Roles(...roles: Role[])`; `RolesGuard`; login trả `{ accessToken, user: { id, email, role } }`; JWT payload `{ sub, email, role }`.

- [ ] **Step 1: Viết test đỏ cho JWT + guard**

Thêm vào cuối `describe('auth', …)` trong `backend/test/auth.spec.ts`:

```ts
  it('register luôn tạo CUSTOMER; login trả role và nhét role vào JWT', async () => {
    await svc.register({ email: 'c@b.co', password: 'secret1' });
    expect((await repo.findByEmail('c@b.co'))!.role).toBe('CUSTOMER');
    const r = await svc.login({ email: 'c@b.co', password: 'secret1' });
    expect(r.user.role).toBe('CUSTOMER');
    expect(decodePayload(r.accessToken).role).toBe('CUSTOMER');
  });

  it('login tài khoản BARISTA → role BARISTA trong JWT và trong req.user', async () => {
    await repo.save({ id: 'b1', email: 'b@b.co', loyaltyPoints: 0, role: 'BARISTA' as any, passwordHash: await bcrypt.hash('secret1', 10) });
    const r = await svc.login({ email: 'b@b.co', password: 'secret1' });
    expect(decodePayload(r.accessToken).role).toBe('BARISTA');
    const req: any = { headers: { authorization: `Bearer ${r.accessToken}` } };
    await new JwtAuthGuard(jwt).canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);
    expect(req.user).toEqual({ id: 'b1', email: 'b@b.co', role: 'BARISTA' });
  });

  it('token cũ không có role → req.user.role = CUSTOMER', async () => {
    const token = await jwt.signAsync({ sub: 'u9', email: 'old@b.co' });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    await new JwtAuthGuard(jwt).canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);
    expect(req.user.role).toBe('CUSTOMER');
  });
```

Tạo `backend/test/roles.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../src/auth/roles.decorator';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/contracts/user.contract';

class Fake {
  @Roles(Role.BARISTA, Role.ADMIN)
  staffOnly() {}
  open() {}
}

function ctx(handler: Function, user?: { role: Role }) {
  return {
    getHandler: () => handler,
    getClass: () => Fake,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  test('route không gắn @Roles → cho qua', () => {
    expect(guard.canActivate(ctx(Fake.prototype.open, { role: Role.CUSTOMER }))).toBe(true);
  });

  test.each([Role.BARISTA, Role.ADMIN])('%s được vào route staff', (role) => {
    expect(guard.canActivate(ctx(Fake.prototype.staffOnly, { role }))).toBe(true);
  });

  test('CUSTOMER vào route staff → 403', () => {
    expect(() => guard.canActivate(ctx(Fake.prototype.staffOnly, { role: Role.CUSTOMER }))).toThrow(ForbiddenException);
  });

  test('không có req.user → 403', () => {
    expect(() => guard.canActivate(ctx(Fake.prototype.staffOnly))).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd backend && npx jest test/auth.spec.ts test/roles.spec.ts`
Expected: FAIL (`Cannot find module '../src/auth/roles.decorator'`, `role` undefined).

- [ ] **Step 3: Contract + schema + migration**

`backend/src/contracts/user.contract.ts` — thêm trên `UserDto` và một trường:

```ts
export enum Role {
  CUSTOMER = 'CUSTOMER',
  BARISTA = 'BARISTA',
  ADMIN = 'ADMIN',
}

/** Người đang gọi API (lấy từ JWT): dùng cho luật theo vai trò ở service. */
export type Actor = { id: string; role: Role };
```

và trong `interface UserDto` thêm:

```ts
  /** Mở rộng ngoài đề (§3.2): vai trò quầy/quản trị. Thiếu = CUSTOMER. */
  role?: Role;
```

`backend/prisma/schema.prisma`, model `User`, thêm sau `loyaltyPoints`:

```prisma
  role          String  @default("CUSTOMER")
```

Tạo `backend/prisma/migrations/20261009000000_user_role/migration.sql`:

```sql
-- Mở rộng ngoài đề §12.2: vai trò người dùng (CUSTOMER / BARISTA / ADMIN), vẫn 5 thực thể
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'CUSTOMER';
```

Run: `cd backend && npx prisma generate` (cập nhật kiểu Prisma Client có `role`).

- [ ] **Step 4: Repo + auth + guard**

`backend/src/prisma/prisma-user.repo.ts`: thêm import `Role` từ `../contracts/user.contract`; trong `findById` và `findByEmail` trả thêm `role: u.role as Role`; trong `save`:

```ts
      create: { id: user.id, email: user.email, passwordHash: user.passwordHash ?? '', loyaltyPoints: user.loyaltyPoints, role: user.role ?? Role.CUSTOMER },
      update: { email: user.email, loyaltyPoints: user.loyaltyPoints, ...(user.role ? { role: user.role } : {}) },
```

và câu `return` của `save`, `addLoyaltyPoints` thêm `role: u.role as Role`.

`backend/src/auth/auth.service.ts`:

```ts
import { IUserRepository, Role } from '../contracts/user.contract';
// register: thêm role: Role.CUSTOMER vào object save (đăng ký công khai không bao giờ tạo nhân viên)
// login:
    const role = user.role ?? Role.CUSTOMER;
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role });
    return { accessToken, user: { id: user.id, email: user.email, role } };
```

`backend/src/auth/jwt-auth.guard.ts`, thay dòng gán `req.user`:

```ts
      // Token phát trước khi có role (hoặc thiếu role) coi là CUSTOMER
      req.user = { id: payload.sub, email: payload.email, role: payload.role ?? 'CUSTOMER' };
```

Tạo `backend/src/auth/roles.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../contracts/user.contract';

export const ROLES_KEY = 'roles';
// Gắn lên route cần vai trò; dùng cùng @UseGuards(JwtAuthGuard, RolesGuard) (JwtAuthGuard phải đứng trước để có req.user)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

Tạo `backend/src/auth/roles.guard.ts`:

```ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../contracts/user.contract';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
```

`backend/src/auth/auth.module.ts`: thêm `RolesGuard` vào `providers` và `exports`, và dòng cuối file `export { RolesGuard } from './roles.guard'; export { Roles } from './roles.decorator';`.

- [ ] **Step 5: Seed nhân viên**

`backend/prisma/seed.ts`, ngay sau upsert `u1` thêm (và sửa upsert `u1` thêm `role: 'CUSTOMER'` ở cả `create` lẫn `update`):

```ts
  // Mở rộng ngoài đề (§3.2): tài khoản quầy + quản trị cho demo /barista, /admin
  for (const s of [
    { id: 'staff-barista', email: 'barista@brewlite.vn', password: 'barista1234', role: 'BARISTA' },
    { id: 'staff-admin', email: 'admin@brewlite.vn', password: 'admin1234', role: 'ADMIN' },
  ]) {
    const passwordHash = await bcrypt.hash(s.password, 10);
    await db.user.upsert({
      where: { id: s.id },
      create: { id: s.id, email: s.email, passwordHash, role: s.role, loyaltyPoints: 0 },
      update: { email: s.email, passwordHash, role: s.role },
    });
  }
```

và sửa dòng `console.log` thành `'seeded: u1 (CUSTOMER), staff-barista, staff-admin, p1..p4 (stock 10), order-1042 PENDING 35000'`.

- [ ] **Step 6: Chạy test, xác nhận xanh**

Run: `cd backend && npx jest && npx tsc --noEmit -p .`
Expected: toàn bộ PASS (68 cũ + 7 mới), tsc exit 0.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma backend/src/contracts/user.contract.ts backend/src/prisma/prisma-user.repo.ts backend/src/auth backend/test/auth.spec.ts backend/test/roles.spec.ts
git commit -m "feat(auth): vai tro CUSTOMER/BARISTA/ADMIN tren User + JWT + RolesGuard, seed tai khoan quay/quan tri"
```

---

### Task 2: Hàng đợi quầy `GET /orders?status=` (Barista/Admin)

**Files:**
- Modify: `backend/src/contracts/order.contract.ts`
- Modify: `backend/src/stubs/in-memory-order.repo.ts`, `backend/src/prisma/prisma-order.repo.ts`
- Modify: `backend/src/order/order.service.ts`, `backend/src/order/order.controller.ts`
- Test: `backend/test/barista-queue.spec.ts` (mới)

**Interfaces:**
- Consumes: `Role`, `Roles`, `RolesGuard` (Task 1).
- Produces: `IOrderRepository.findByStatuses(statuses: OrderStatus[], tx?): Promise<OrderDto[]>` (cũ trước, FIFO theo `createdAt`); `QUEUE_STATUSES = [PAID, PREPARING, READY]`; `OrderService.listQueue(statuses?: OrderStatus[]): Promise<QueueOrderDto[]>`; `QueueOrderDto = OrderDto & { items: Array<OrderItemDto & { productName: string }> }`; HTTP `GET /orders?status=PAID,PREPARING` (JWT + BARISTA/ADMIN; thiếu `status` = cả 3).

- [ ] **Step 1: Viết test đỏ**

Tạo `backend/test/barista-queue.spec.ts`:

```ts
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { OrderStatus } from '../src/contracts/order.contract';
import { Role } from '../src/contracts/user.contract';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';
import { RolesGuard } from '../src/auth/roles.guard';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { InMemoryOrderRepo } from '../src/stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';

async function setup() {
  const orders = new InMemoryOrderRepo();
  const products = new InMemoryProductRepo();
  await products.save({ id: 'p1', name: 'Latte', price: 35000, stock: 5, version: 1 });
  const mk = (id: string, status: OrderStatus, minute: number) =>
    orders.save({ id, userId: 'u1', status, total: 40000, items: [{ productId: 'p1', quantity: 1, unitPrice: 40000, size: 'M', toppings: [] }], createdAt: new Date(2026, 9, 9, 10, minute) });
  await mk('o-paid-late', OrderStatus.PAID, 30);
  await mk('o-paid-early', OrderStatus.PAID, 10);
  await mk('o-prep', OrderStatus.PREPARING, 20);
  await mk('o-ready', OrderStatus.READY, 25);
  await mk('o-pending', OrderStatus.PENDING, 5);
  await mk('o-done', OrderStatus.COMPLETED, 1);
  return { orders, products, svc: new OrderService(orders, products) };
}

describe('hàng đợi quầy GET /orders?status=', () => {
  test('mặc định lấy PAID/PREPARING/READY, cũ trước (FIFO), kèm tên món', async () => {
    const { svc } = await setup();
    const q = await svc.listQueue();
    expect(q.map((o) => o.id)).toEqual(['o-paid-early', 'o-prep', 'o-ready', 'o-paid-late']);
    expect(q[0].items[0].productName).toBe('Latte');
  });

  test('lọc theo 1 trạng thái', async () => {
    const { svc } = await setup();
    expect((await svc.listQueue([OrderStatus.PAID])).map((o) => o.id)).toEqual(['o-paid-early', 'o-paid-late']);
  });

  test('trạng thái ngoài hàng đợi (PENDING/COMPLETED) → 400', async () => {
    const { svc } = await setup();
    await expect(svc.listQueue([OrderStatus.PENDING])).rejects.toBeInstanceOf(BadRequestException);
  });

  test('controller: parse "PAID,READY", chuỗi lạ → 400', async () => {
    const { svc } = await setup();
    const ctl = new OrderController(svc);
    expect((await ctl.queue('PAID,READY')).map((o) => o.id)).toEqual(['o-paid-early', 'o-ready', 'o-paid-late']);
    await expect(ctl.queue('PAID,FOO')).rejects.toBeInstanceOf(BadRequestException);
  });

  test('route gắn JwtAuthGuard + RolesGuard, chỉ BARISTA/ADMIN', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, OrderController.prototype.queue);
    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    const guard = new RolesGuard(new Reflector());
    const ctx = (role: Role) => ({ getHandler: () => OrderController.prototype.queue, getClass: () => OrderController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as any;
    expect(guard.canActivate(ctx(Role.BARISTA))).toBe(true);
    expect(() => guard.canActivate(ctx(Role.CUSTOMER))).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd backend && npx jest test/barista-queue.spec.ts`
Expected: FAIL (`svc.listQueue is not a function`).

- [ ] **Step 3: Contract + repo**

`backend/src/contracts/order.contract.ts`, trong `IOrderRepository` thêm:

```ts
  /** Hàng đợi quầy: đơn có trạng thái thuộc `statuses`, cũ trước (FIFO theo createdAt). */
  findByStatuses(statuses: OrderStatus[], tx?: TxContext): Promise<OrderDto[]>;
```

`backend/src/stubs/in-memory-order.repo.ts` thêm:

```ts
  async findByStatuses(statuses: OrderStatus[], _tx?: TxContext): Promise<OrderDto[]> {
    return [...this.store.values()]
      .filter((o) => statuses.includes(o.status))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
```

`backend/src/prisma/prisma-order.repo.ts`: thêm `import type { Prisma } from '@prisma/client';`, tách phần map đang lặp ở `findById`/`findByUserId` thành hàm riêng và dùng lại:

```ts
type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

// §12.2 OrderItem không có cột unitPrice → suy ra từ lineTotal/qty (lineTotal = unitPrice*qty, số nguyên)
function toOrderDto(o: OrderRow): OrderDto {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status as OrderStatus,
    total: o.total,
    items: o.items.map((i) => ({
      productId: i.productId,
      quantity: i.qty,
      unitPrice: i.qty > 0 ? Math.floor(i.lineTotal / i.qty) : i.lineTotal,
      size: i.size,
      toppings: parseToppings(i.toppings),
    })),
    createdAt: o.createdAt,
  };
}
```

Sửa `findById` thành `return o ? toOrderDto(o) : null;`, `findByUserId` thành `return list.map(toOrderDto);`, và thêm:

```ts
  async findByStatuses(statuses: OrderStatus[], tx?: TxContext): Promise<OrderDto[]> {
    const list = await this.cx(tx).order.findMany({ where: { status: { in: statuses } }, orderBy: { createdAt: 'asc' }, include: { items: true } });
    return list.map(toOrderDto);
  }
```

- [ ] **Step 4: Service + controller**

`backend/src/order/order.service.ts` — thêm import `OrderItemDto, OrderDto` và:

```ts
export const QUEUE_STATUSES = [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY];
export type QueueOrderDto = OrderDto & { items: Array<OrderItemDto & { productName: string }> };
```

và method trong class:

```ts
  // UC08 (mở rộng ngoài MVP §3.2): hàng đợi quầy, kèm tên món để barista đọc được
  async listQueue(statuses: OrderStatus[] = QUEUE_STATUSES): Promise<QueueOrderDto[]> {
    const bad = statuses.find((s) => !QUEUE_STATUSES.includes(s));
    if (bad) throw new BadRequestException(`Status ${bad} is not in the counter queue`);
    const orders = await this.orders.findByStatuses(statuses);
    const names = new Map<string, string>();
    for (const o of orders) for (const i of o.items) {
      if (!names.has(i.productId)) names.set(i.productId, (await this.products.findById(i.productId))?.name ?? i.productId);
    }
    return orders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i, productName: names.get(i.productId)! })) }));
  }
```

`backend/src/order/order.controller.ts`: import `Query`, `BadRequestException` từ `@nestjs/common`, `OrderStatus` từ `../contracts/order.contract`, `Role` từ `../contracts/user.contract`, `Roles` từ `../auth/roles.decorator`, `RolesGuard` từ `../auth/roles.guard`; thêm route **trước** `@Get('me')`:

```ts
  // UC08: GET /orders?status=PAID,PREPARING,READY — chỉ quầy/quản trị
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARISTA, Role.ADMIN)
  async queue(@Query('status') status?: string) {
    if (!status) return this.orders.listQueue();
    const list = status.split(',').map((s) => s.trim());
    const bad = list.find((s) => !(s in OrderStatus));
    if (bad) throw new BadRequestException(`Unknown status ${bad}`);
    return this.orders.listQueue(list as OrderStatus[]);
  }
```

- [ ] **Step 5: Chạy test**

Run: `cd backend && npx jest && npx tsc --noEmit -p .`
Expected: PASS hết.

- [ ] **Step 6: Commit**

```bash
git add backend/src/contracts/order.contract.ts backend/src/stubs/in-memory-order.repo.ts backend/src/prisma/prisma-order.repo.ts backend/src/order backend/test/barista-queue.spec.ts
git commit -m "feat(order): hang doi quay GET /orders?status= cho BARISTA/ADMIN, FIFO, kem ten mon"
```

---

### Task 3: Luật `PATCH /orders/:id` theo vai trò (bỏ quyền khách tự tiến đơn)

**Files:**
- Modify: `backend/src/payment/payment.service.ts` (`advanceOrder`, `cancelOrderAs`)
- Modify: `backend/src/payment/payment.controller.ts` (`update`)
- Test: `backend/test/order-advance.spec.ts`

**Interfaces:**
- Consumes: `Actor`, `Role` (Task 1).
- Produces: `advanceOrder(actor: Actor, orderId: string, status: OrderStatus)`; `cancelOrderAs(actor: Actor, orderId: string)`. Luật: `PREPARING/READY/COMPLETED` chỉ BARISTA/ADMIN (CUSTOMER → 403 `Only staff can advance orders`); `CANCELLED`: CUSTOMER chỉ đơn của mình, BARISTA/ADMIN mọi đơn; `assertTransition` vẫn quyết định thứ tự.

- [ ] **Step 1: Sửa test sang luật mới (đỏ)**

Trong `backend/test/order-advance.spec.ts`: thêm import `import { Role } from '../src/contracts/user.contract';` và 3 hằng sau hàm `setup`:

```ts
const customer = (id = 'u1') => ({ id, role: Role.CUSTOMER });
const barista = { id: 'staff-barista', role: Role.BARISTA };
const admin = { id: 'staff-admin', role: Role.ADMIN };
```

Thay các lời gọi:
- `s.svc.advanceOrder('u1', …)` ở test "happy path" → `s.svc.advanceOrder(barista, …)`.
- trong `test.each` sai thứ tự: `s.svc.cancelOrderAs('u1', 'o1')` → `s.svc.cancelOrderAs(customer(), 'o1')`, `s.svc.advanceOrder('u1', 'o1', to)` → `s.svc.advanceOrder(barista, 'o1', to)`.
- test "từ chối CANCELLED": `advanceOrder('u1', …)` → `advanceOrder(barista, …)`.
- test "chủ đơn lạ bị 403": `advanceOrder('u2', …)` → `advanceOrder(customer('u2'), …)`; `cancelOrderAs('u2', …)` → `cancelOrderAs(customer('u2'), …)`.
- test "cancelOrderAs của chủ đơn": `cancelOrderAs('u1', 'o1')` → `cancelOrderAs(customer(), 'o1')`.
- test "PaymentController rẽ CANCELLED …": đối số `req` đang là `{ user: { id: 'u1' } }` → `{ user: customer() }` cho nhánh CANCELLED và `{ user: barista }` cho nhánh tiến đơn.

Thêm test mới vào cuối `describe`:

```ts
  test('khách (kể cả chủ đơn) KHÔNG tự tiến đơn được → 403, đơn vẫn PAID', async () => {
    const s = setup();
    await seedPaid(s);
    await expect(s.svc.advanceOrder(customer(), 'o1', OrderStatus.PREPARING)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await s.orders.findById('o1'))!.status).toBe(OrderStatus.PAID);
  });

  test('ADMIN cũng tiến đơn được (không cần là chủ đơn)', async () => {
    const s = setup();
    await seedPaid(s);
    await expect(s.svc.advanceOrder(admin, 'o1', OrderStatus.PREPARING)).resolves.toMatchObject({ status: OrderStatus.PREPARING });
  });

  test('UC12: barista hủy đơn PAID của khách (hết nguyên liệu) → hoàn tiền thực thu + hoàn kho', async () => {
    const s = setup();
    await seedPaid(s);
    await s.payments.save({ id: 'pay1', orderId: 'o1', idempotencyKey: 'k1', amount: 18000, method: 'WALLET', status: 'SUCCESS', discount: 2000, loyaltyPointsEarned: 1, createdAt: new Date() });
    await expect(s.svc.cancelOrderAs(barista, 'o1')).resolves.toMatchObject({ status: OrderStatus.CANCELLED });
    expect(s.gateway.refunds).toEqual([{ orderId: 'o1', amount: 18000 }]);
    expect((await s.products.findById('p1'))!.stock).toBe(6);
  });

  test('barista hủy đơn đang PREPARING vẫn bị state machine chặn 400', async () => {
    const s = setup();
    await seedPaid(s);
    await s.svc.advanceOrder(barista, 'o1', OrderStatus.PREPARING);
    await expect(s.svc.cancelOrderAs(barista, 'o1')).rejects.toMatchObject({ status: 400 });
  });
```

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd backend && npx jest test/order-advance.spec.ts`
Expected: FAIL (kiểu `Actor` không khớp `string`; test khách tự tiến đơn không ra 403).

- [ ] **Step 3: Service + controller**

`backend/src/payment/payment.service.ts`: import `Actor, Role` từ `../contracts/user.contract`; thay 2 method:

```ts
  // UC09–UC11 (mở rộng §3.2): chỉ quầy/quản trị tiến đơn PAID→PREPARING→READY→COMPLETED; khách nhận 403
  async advanceOrder(actor: Actor, orderId: string, status: OrderStatus) {
    if (status === OrderStatus.CANCELLED) throw new BadRequestException('Use cancel for CANCELLED');
    if (actor.role === Role.CUSTOMER) throw new ForbiddenException('Only staff can advance orders');
    return this.withLock(`order:${orderId}`, async () => {
      const order = await this.orders.findById(orderId);
      if (!order) throw new NotFoundException('Order not found');
      assertTransition(order.status, status);
      return this.orders.updateStatus(order.id, status);
    });
  }

  // UC06 (khách hủy đơn của mình) + UC12 (quầy hủy đơn hết nguyên liệu); hoàn tiền/hoàn kho trong cancelOrder
  async cancelOrderAs(actor: Actor, orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (actor.role === Role.CUSTOMER && order.userId !== actor.id) throw new ForbiddenException('Not your order');
    return this.cancelOrder(orderId);
  }
```

`backend/src/payment/payment.controller.ts`, method `update`:

```ts
    const actor = { id: req.user.id, role: req.user.role };
    if (dto.status === OrderStatus.CANCELLED) return this.payments.cancelOrderAs(actor, id);
    return this.payments.advanceOrder(actor, id, dto.status);
```

- [ ] **Step 4: Chạy test**

Run: `cd backend && npx jest && npx tsc --noEmit -p .`
Expected: PASS hết. (Riêng `scripts/demo-state-machine.sh` sẽ hỏng vì dùng tài khoản khách — sửa ở Task 9.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/payment backend/test/order-advance.spec.ts
git commit -m "feat(order): PATCH /orders/:id theo vai tro - chi quay/quan tri tien don, quay huy duoc don PAID (UC12)"
```

---

### Task 4: API tồn kho cho Admin

**Files:**
- Modify: `backend/src/contracts/product.contract.ts`
- Modify: `backend/src/stubs/in-memory-product.repo.ts`, `backend/src/prisma/prisma-product.repo.ts`
- Modify: `backend/src/product/product.service.ts`, `backend/src/product/product.module.ts`
- Create: `backend/src/product/dto/adjust-stock.dto.ts`, `backend/src/product/admin-product.controller.ts`
- Test: `backend/test/admin-inventory.spec.ts` (mới)

**Interfaces:**
- Consumes: `Role`, `Roles`, `RolesGuard`, `AuthModule` export (Task 1).
- Produces: `IProductRepository.findAll(tx?)` (mọi món, theo tên), `setStockWithOptimisticLock(id, stock, currentVersion, tx?): Promise<boolean>`; `ProductService.listAll()`, `adjustStock(id, dto: AdjustStockDto)`; `AdjustStockDto { mode: 'set' | 'delta'; value: number; version: number }`; HTTP `GET /admin/products`, `PATCH /admin/products/:id/stock` (JWT + ADMIN). Lỗi: 404 món lạ, 409 `Stock changed, reload` khi `version` lệch, 400 khi kết quả âm.

- [ ] **Step 1: Viết test đỏ**

Tạo `backend/test/admin-inventory.spec.ts`:

```ts
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AdminProductController } from '../src/product/admin-product.controller';
import { AdjustStockDto } from '../src/product/dto/adjust-stock.dto';
import { ProductService } from '../src/product/product.service';
import { InMemoryProductRepo } from '../src/stubs/in-memory-product.repo';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/contracts/user.contract';

async function setup() {
  const repo = new InMemoryProductRepo();
  await repo.save({ id: 'p1', name: 'Latte', price: 35000, stock: 10, version: 3 });
  await repo.save({ id: 'p0', name: 'Americano', price: 40000, stock: 0, version: 1 });
  return { repo, svc: new ProductService(repo) };
}

describe('UC14 admin tồn kho', () => {
  test('listAll trả cả món hết hàng (menu khách thì ẩn), sắp theo tên', async () => {
    const { svc } = await setup();
    expect((await svc.listAll()).map((p) => [p.id, p.stock])).toEqual([['p0', 0], ['p1', 10]]);
    expect((await svc.listAvailable()).map((p) => p.id)).toEqual(['p1']);
  });

  test('đặt số (set) và cộng/trừ (delta) đều tăng version', async () => {
    const { svc } = await setup();
    const a = await svc.adjustStock('p1', { mode: 'set', value: 25, version: 3 });
    expect([a.stock, a.version]).toEqual([25, 4]);
    const b = await svc.adjustStock('p1', { mode: 'delta', value: -5, version: 4 });
    expect([b.stock, b.version]).toEqual([20, 5]);
  });

  test('version cũ (có người vừa bán/sửa) → 409, kho không đổi', async () => {
    const { svc, repo } = await setup();
    await expect(svc.adjustStock('p1', { mode: 'set', value: 1, version: 2 })).rejects.toBeInstanceOf(ConflictException);
    expect((await repo.findById('p1'))!.stock).toBe(10);
  });

  test('kết quả âm → 400; món lạ → 404', async () => {
    const { svc } = await setup();
    await expect(svc.adjustStock('p1', { mode: 'delta', value: -11, version: 3 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.adjustStock('nope', { mode: 'set', value: 1, version: 1 })).rejects.toBeInstanceOf(NotFoundException);
  });

  test('DTO: mode lạ, value lẻ bị từ chối (âm do service chặn)', async () => {
    const errs = async (o: object) => (await validate(plainToInstance(AdjustStockDto, o))).length;
    expect(await errs({ mode: 'set', value: 5, version: 1 })).toBe(0);
    expect(await errs({ mode: 'delta', value: -3, version: 1 })).toBe(0);
    expect(await errs({ mode: 'xx', value: 5, version: 1 })).toBeGreaterThan(0);
    expect(await errs({ mode: 'set', value: 1.5, version: 1 })).toBeGreaterThan(0);
  });

  test('controller chỉ ADMIN (BARISTA bị 403)', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminProductController)).toEqual([JwtAuthGuard, RolesGuard]);
    const guard = new RolesGuard(new Reflector());
    const ctx = (role: Role) => ({ getHandler: () => AdminProductController.prototype.list, getClass: () => AdminProductController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as any;
    expect(guard.canActivate(ctx(Role.ADMIN))).toBe(true);
    expect(() => guard.canActivate(ctx(Role.BARISTA))).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd backend && npx jest test/admin-inventory.spec.ts`
Expected: FAIL (`Cannot find module '../src/product/admin-product.controller'`).

- [ ] **Step 3: Contract + repo**

`backend/src/contracts/product.contract.ts`, thêm vào `IProductRepository`:

```ts
  /** UC14: mọi món, kể cả hết hàng, sắp theo tên. */
  findAll(tx?: TxContext): Promise<ProductDto[]>;
  /** UC14: đặt tồn kho tuyệt đối nếu version khớp; tăng version. false = có người đổi trước. */
  setStockWithOptimisticLock(id: string, stock: number, currentVersion: number, tx?: TxContext): Promise<boolean>;
```

`backend/src/stubs/in-memory-product.repo.ts`:

```ts
  async findAll(_tx?: TxContext): Promise<ProductDto[]> {
    return [...this.store.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async setStockWithOptimisticLock(id: string, stock: number, currentVersion: number, _tx?: TxContext): Promise<boolean> {
    const p = this.store.get(id);
    if (!p || p.version !== currentVersion) return false;
    p.stock = stock;
    p.version += 1;
    return true;
  }
```

`backend/src/prisma/prisma-product.repo.ts`:

```ts
  async findAll(tx?: TxContext): Promise<ProductDto[]> {
    const list = await this.cx(tx).product.findMany({ orderBy: { name: 'asc' } });
    return list.map((p) => ({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl ?? undefined, stock: p.stock, version: p.version }));
  }

  async setStockWithOptimisticLock(id: string, stock: number, currentVersion: number, tx?: TxContext): Promise<boolean> {
    const r = await this.cx(tx).product.updateMany({ where: { id, version: currentVersion }, data: { stock, version: { increment: 1 } } });
    return r.count === 1;
  }
```

- [ ] **Step 4: DTO + service + controller + module**

Tạo `backend/src/product/dto/adjust-stock.dto.ts`:

```ts
import { IsIn, IsInt, Min } from 'class-validator';

export class AdjustStockDto {
  // set: đặt số tuyệt đối; delta: cộng/trừ (âm = trừ)
  @IsIn(['set', 'delta'])
  mode!: 'set' | 'delta';

  @IsInt()
  value!: number;

  // version đang thấy trên màn hình (optimistic lock, cùng cơ chế §9 ý 3)
  @IsInt()
  @Min(1)
  version!: number;
}
```

`backend/src/product/product.service.ts` — import `BadRequestException, ConflictException` và `AdjustStockDto`; thêm:

```ts
  // UC14 (mở rộng §3.2): admin xem mọi món, kể cả hết hàng
  listAll() {
    return this.products.findAll();
  }

  // UC14: chỉnh tồn kho theo version đang thấy; ai bán/sửa trước thì 409 để admin tải lại
  async adjustStock(id: string, dto: AdjustStockDto) {
    const p = await this.getById(id);
    if (p.version !== dto.version) throw new ConflictException('Stock changed, reload');
    const next = dto.mode === 'set' ? dto.value : p.stock + dto.value;
    if (next < 0) throw new BadRequestException('Stock cannot be negative');
    if (!(await this.products.setStockWithOptimisticLock(id, next, dto.version))) throw new ConflictException('Stock changed, reload');
    return this.getById(id);
  }
```

Tạo `backend/src/product/admin-product.controller.ts`:

```ts
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../contracts/user.contract';

// UC14 (mở rộng ngoài MVP §3.2): kiểm / điều chỉnh tồn kho, chỉ ADMIN
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductController {
  constructor(private products: ProductService) {}

  @Get()
  list() {
    return this.products.listAll();
  }

  @Patch(':id/stock')
  adjust(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.products.adjustStock(id, dto);
  }
}
```

`backend/src/product/product.module.ts`: thêm `imports: [AuthModule]` (import từ `../auth/auth.module`) và `controllers: [ProductController, AdminProductController]`.

- [ ] **Step 5: Chạy test**

Run: `cd backend && npx jest && npx tsc --noEmit -p .`
Expected: PASS hết.

- [ ] **Step 6: Commit**

```bash
git add backend/src/contracts/product.contract.ts backend/src/stubs/in-memory-product.repo.ts backend/src/prisma/prisma-product.repo.ts backend/src/product backend/test/admin-inventory.spec.ts
git commit -m "feat(product): API ton kho cho ADMIN - GET /admin/products, PATCH /admin/products/:id/stock (optimistic lock)"
```

---

### Task 5: Frontend — vai trò, điều hướng sau đăng nhập, bỏ nút "Quầy (demo)"

**Files:**
- Create: `frontend/src/lib/auth.ts`, `frontend/src/lib/auth.test.ts`
- Modify: `frontend/src/lib/api.ts` (export `API_BASE`)
- Modify: `frontend/src/app/login/page.tsx`, `frontend/src/components/Header.tsx`
- Modify: `frontend/src/app/history/page.tsx`, `frontend/src/lib/order-status.ts`, `frontend/src/lib/order-status.test.ts`
- Modify: `frontend/Dockerfile`, `docker-compose.yml`, `.env.example` (bỏ `NEXT_PUBLIC_DEMO_COUNTER`)

**Interfaces:**
- Produces: `type Role = 'CUSTOMER' | 'BARISTA' | 'ADMIN'`; `TOKEN_KEY = 'brewlite-token'`; `getToken(): string | null`; `roleFromToken(token: string | null): Role | null`; `homeFor(role: Role): string`; `export const API_BASE` trong `lib/api.ts`.
- Removes: `demoCounterEnabled` (lib/order-status.ts). `nextStatus` GIỮ (Task 6 dùng).

- [ ] **Step 1: Viết test đỏ**

Tạo `frontend/src/lib/auth.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { homeFor, roleFromToken } from './auth';

// JWT giả: chỉ phần payload quan trọng (frontend không kiểm chữ ký, server mới là nơi chặn quyền)
const fakeJwt = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.s`;

describe('roleFromToken', () => {
  test.each(['CUSTOMER', 'BARISTA', 'ADMIN'])('đọc role %s', (role) => {
    expect(roleFromToken(fakeJwt({ sub: 'u', role }))).toBe(role);
  });
  test('token cũ không có role → CUSTOMER', () => {
    expect(roleFromToken(fakeJwt({ sub: 'u' }))).toBe('CUSTOMER');
  });
  test('không có token / token hỏng → null', () => {
    expect(roleFromToken(null)).toBeNull();
    expect(roleFromToken('abc')).toBeNull();
  });
});

test('homeFor: barista → /barista, admin → /admin, khách → /', () => {
  expect(homeFor('BARISTA')).toBe('/barista');
  expect(homeFor('ADMIN')).toBe('/admin');
  expect(homeFor('CUSTOMER')).toBe('/');
});
```

Trong `frontend/src/lib/order-status.test.ts`: xóa mọi test của `demoCounterEnabled` (tìm bằng `grep -n demoCounterEnabled`).

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd frontend && npx vitest run src/lib/auth.test.ts`
Expected: FAIL (`Failed to resolve import "./auth"`).

- [ ] **Step 3: `lib/auth.ts`**

```ts
// ============================================================
// FEATURE: Vai trò người dùng phía FE (mở rộng §3.2). Chỉ để điều hướng / ẩn hiện;
// quyền thật do backend chặn (JwtAuthGuard + RolesGuard).
// ============================================================

export type Role = 'CUSTOMER' | 'BARISTA' | 'ADMIN';

export const TOKEN_KEY = 'brewlite-token';

export const getToken = (): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export function roleFromToken(token: string | null): Role | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64));
    return payload.role === 'BARISTA' || payload.role === 'ADMIN' ? payload.role : 'CUSTOMER';
  } catch {
    return null;
  }
}

const HOME: Record<Role, string> = { CUSTOMER: '/', BARISTA: '/barista', ADMIN: '/admin' };
export const homeFor = (role: Role): string => HOME[role];
```

`frontend/src/lib/api.ts` dòng 9: `const API_BASE` → `export const API_BASE`.

- [ ] **Step 4: Đăng nhập + Header + bỏ nút demo**

`frontend/src/app/login/page.tsx`: import `{ TOKEN_KEY, homeFor, roleFromToken }` từ `@/lib/auth`; nhánh login thay 2 dòng:

```ts
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        router.push(homeFor(roleFromToken(data.accessToken) ?? 'CUSTOMER'));
```

`frontend/src/components/Header.tsx`: import `useEffect, useState` và `{ getToken, roleFromToken, type Role }`; trong component:

```ts
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => setRole(roleFromToken(getToken())), []);
```

và trong `<nav>` trước link "Lịch sử":

```tsx
        {(role === 'BARISTA' || role === 'ADMIN') && (
          <Link href="/barista" style={styles.link}>
            Quầy
          </Link>
        )}
        {role === 'ADMIN' && (
          <Link href="/admin" style={styles.link}>
            Kho
          </Link>
        )}
```

`frontend/src/app/history/page.tsx`: xóa import `advanceOrder`, `STATUS_LABEL`, `demoCounterEnabled`, `nextStatus`; xóa hàm `onAdvance`, biến `next` và khối `{next && (<button …Quầy (demo)…>)}`. Giữ `OrderStatusTrack` và nút "Hủy đơn".

`frontend/src/lib/order-status.ts`: xóa `demoCounterEnabled` và chú thích "Quầy (demo)" phía trên `COUNTER_NEXT`; đổi chú thích thành `// Bước tiếp theo ở quầy (UC09–UC11, màn /barista): PAID → PREPARING → READY → COMPLETED.`

`frontend/Dockerfile`, `docker-compose.yml`, `.env.example`: xóa mọi dòng chứa `NEXT_PUBLIC_DEMO_COUNTER` (kiểm `grep -rn NEXT_PUBLIC_DEMO_COUNTER .` ra rỗng, trừ `docs/`).

- [ ] **Step 5: Chạy test**

Run: `cd frontend && npx vitest run && npx tsc --noEmit`
Expected: PASS; `grep -rn "Quầy (demo)" frontend/src` ra rỗng.

- [ ] **Step 6: Commit**

```bash
git add frontend docker-compose.yml .env.example
git commit -m "feat(frontend): doc vai tro tu JWT, dieu huong /barista /admin sau dang nhap, bo nut Quay (demo)"
```

---

### Task 6: Màn quầy `/barista`

**Files:**
- Create: `frontend/src/lib/barista.ts`, `frontend/src/lib/barista.test.ts`
- Create: `frontend/src/app/barista/page.tsx`

**Interfaces:**
- Consumes: `API_BASE` (api.ts), `advanceOrder`, `cancelOrder` (api.ts, đã có), `nextStatus`, `STATUS_LABEL` (order-status.ts), `getToken`, `roleFromToken` (auth.ts), `GET /orders?status=` (Task 2), luật PATCH (Task 3).
- Produces: `QueueOrder`, `QueueColumn = 'PAID' | 'PREPARING' | 'READY'`, `QUEUE_COLUMNS`, `ACTION_LABEL`, `groupQueue(orders)`, `fetchQueue(token)`.

- [ ] **Step 1: Viết test đỏ**

Tạo `frontend/src/lib/barista.test.ts`:

```ts
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ACTION_LABEL, QUEUE_COLUMNS, fetchQueue, groupQueue, type QueueOrder } from './barista';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

const order = (id: string, status: string, minute: number): QueueOrder => ({
  id, status, total: 40000, createdAt: `2026-10-09T10:${String(minute).padStart(2, '0')}:00Z`,
  items: [{ productId: 'p1', productName: 'Latte', quantity: 1, unitPrice: 40000, size: 'M', toppings: [] }],
});

test('3 cột đúng thứ tự sơ đồ §9.1 và nhãn nút', () => {
  expect(QUEUE_COLUMNS.map((c) => c.status)).toEqual(['PAID', 'PREPARING', 'READY']);
  expect(ACTION_LABEL).toEqual({ PAID: 'Nhận pha', PREPARING: 'Pha xong', READY: 'Đã giao' });
});

test('groupQueue chia cột, cũ trước, bỏ trạng thái ngoài hàng đợi', () => {
  const g = groupQueue([order('b', 'PAID', 30), order('a', 'PAID', 10), order('c', 'READY', 5), order('x', 'COMPLETED', 1)]);
  expect(g.PAID.map((o) => o.id)).toEqual(['a', 'b']);
  expect(g.PREPARING).toEqual([]);
  expect(g.READY.map((o) => o.id)).toEqual(['c']);
});

describe('fetchQueue', () => {
  test('GET /orders?status=PAID,PREPARING,READY kèm Bearer', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, [order('a', 'PAID', 1)]));
    vi.stubGlobal('fetch', f);
    expect((await fetchQueue('tok')).map((o) => o.id)).toEqual(['a']);
    const [url, init] = f.mock.calls[0];
    expect(url).toMatch(/\/orders\?status=PAID,PREPARING,READY$/);
    expect(init.headers.Authorization).toBe('Bearer tok');
  });
  test('403 → báo cần tài khoản quầy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, { message: 'Insufficient role' })));
    await expect(fetchQueue('tok')).rejects.toThrow(/tài khoản quầy/);
  });
  test('401 → báo đăng nhập lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(401, {})));
    await expect(fetchQueue('tok')).rejects.toThrow(/đăng nhập/);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd frontend && npx vitest run src/lib/barista.test.ts`
Expected: FAIL (`Failed to resolve import "./barista"`).

- [ ] **Step 3: `lib/barista.ts`**

```ts
// ============================================================
// FEATURE: Màn quầy (UC08–UC12, mở rộng ngoài MVP §3.2): hàng đợi 3 cột theo sơ đồ §9.1.
// ============================================================
import { API_BASE } from './api';

export interface QueueItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

export interface QueueOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: QueueItem[];
}

export type QueueColumn = 'PAID' | 'PREPARING' | 'READY';

export const QUEUE_COLUMNS: { status: QueueColumn; title: string }[] = [
  { status: 'PAID', title: 'Chờ pha' },
  { status: 'PREPARING', title: 'Đang pha' },
  { status: 'READY', title: 'Sẵn sàng' },
];

// UC09 / UC10 / UC11
export const ACTION_LABEL: Record<QueueColumn, string> = { PAID: 'Nhận pha', PREPARING: 'Pha xong', READY: 'Đã giao' };

export function groupQueue(orders: QueueOrder[]): Record<QueueColumn, QueueOrder[]> {
  const sorted = [...orders].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  return {
    PAID: sorted.filter((o) => o.status === 'PAID'),
    PREPARING: sorted.filter((o) => o.status === 'PREPARING'),
    READY: sorted.filter((o) => o.status === 'READY'),
  };
}

export async function fetchQueue(token: string): Promise<QueueOrder[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/orders?status=PAID,PREPARING,READY`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new Error('Không kết nối được máy chủ (hàng đợi quầy).');
  }
  if (res.status === 401) throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  if (res.status === 403) throw new Error('Trang này cần tài khoản quầy (Barista) hoặc quản trị.');
  if (!res.ok) throw new Error(`Không tải được hàng đợi (mã ${res.status}).`);
  return res.json();
}
```

- [ ] **Step 4: Trang `app/barista/page.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import { advanceOrder, cancelOrder } from '@/lib/api';
import { nextStatus } from '@/lib/order-status';
import { getToken, roleFromToken } from '@/lib/auth';
import { ACTION_LABEL, QUEUE_COLUMNS, fetchQueue, groupQueue, type QueueOrder } from '@/lib/barista';

// FEATURE: Màn quầy (UC08–UC12, mở rộng §3.2). Tự tải lại mỗi 5 giây; mọi chuyển trạng thái do backend kiểm (assertTransition).
const POLL_MS = 5000;

export default function BaristaPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setToken(getToken()), []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setOrders(await fetchQueue(token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function act(o: QueueOrder, run: (t: string) => Promise<void>) {
    if (!token) return;
    setBusyId(o.id);
    try {
      await run(token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setBusyId(null);
    }
  }

  if (token === undefined) return null;
  const role = roleFromToken(token);
  if (role !== 'BARISTA' && role !== 'ADMIN')
    return (
      <section>
        <h1>Quầy pha chế</h1>
        <p>Trang này dành cho tài khoản quầy. <Link href="/login">Đăng nhập</Link> bằng barista@brewlite.vn.</p>
      </section>
    );

  const cols = groupQueue(orders);
  return (
    <section>
      <h1>Quầy pha chế</h1>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      <div style={styles.board}>
        {QUEUE_COLUMNS.map((c) => (
          <div key={c.status} style={styles.col}>
            <h2 style={{ fontSize: 16 }}>{c.title} ({cols[c.status].length})</h2>
            {cols[c.status].length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>Không có đơn</p>}
            {cols[c.status].map((o) => {
              const next = nextStatus(o.status);
              return (
                <article key={o.id} style={styles.card}>
                  <p style={{ margin: 0, fontWeight: 700 }}>#{o.id.slice(0, 8)} • {formatVND(o.total)}</p>
                  <p style={{ margin: '2px 0', fontSize: 12, color: '#6b7280' }}>{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</p>
                  <ul style={{ margin: '4px 0', paddingLeft: 18, fontSize: 14 }}>
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.quantity}× {i.productName} ({i.size ?? 'M'}{i.toppings?.length ? ` + ${i.toppings.join(', ')}` : ''})
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {next && (
                      <button disabled={busyId === o.id} style={styles.primary} onClick={() => act(o, (t) => advanceOrder(o.id, next, t))}>
                        {busyId === o.id ? 'Đang chuyển…' : ACTION_LABEL[c.status]}
                      </button>
                    )}
                    {c.status === 'PAID' && (
                      <button
                        disabled={busyId === o.id}
                        style={styles.danger}
                        onClick={() => window.confirm('Hủy đơn vì hết nguyên liệu? Khách được hoàn tiền, kho được hoàn lại.') && act(o, (t) => cancelOrder(o.id, t))}
                      >
                        Hủy (hết nguyên liệu)
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  board: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 },
  col: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 },
  primary: { padding: '6px 12px', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 },
  danger: { padding: '6px 12px', border: '1px solid #b91c1c', color: '#b91c1c', background: '#fff', borderRadius: 6, cursor: 'pointer' },
};
```

- [ ] **Step 5: Chạy test + build**

Run: `cd frontend && npx vitest run && npx tsc --noEmit && npm run build`
Expected: PASS, build có route `/barista`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/barista.ts frontend/src/lib/barista.test.ts frontend/src/app/barista
git commit -m "feat(frontend): man quay /barista - hang doi 3 cot, Nhan pha/Pha xong/Da giao, huy het nguyen lieu, tu tai lai 5s"
```

---

### Task 7: Màn tồn kho `/admin`

**Files:**
- Create: `frontend/src/lib/admin.ts`, `frontend/src/lib/admin.test.ts`
- Create: `frontend/src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `API_BASE`, `getToken`, `roleFromToken`, `formatVND`; HTTP Task 4.
- Produces: `InventoryItem`, `LOW_STOCK = 3`, `stockBadge(stock)`, `fetchInventory(token)`, `adjustStock(token, id, body: { mode: 'set' | 'delta'; value: number; version: number })`.

- [ ] **Step 1: Viết test đỏ**

Tạo `frontend/src/lib/admin.test.ts`:

```ts
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LOW_STOCK, adjustStock, fetchInventory, stockBadge } from './admin';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

test('stockBadge: 0 hết hàng, ≤ LOW_STOCK sắp hết, còn lại bình thường', () => {
  expect(stockBadge(0)).toEqual({ label: 'Hết hàng', tone: 'out' });
  expect(stockBadge(LOW_STOCK)).toEqual({ label: 'Sắp hết', tone: 'low' });
  expect(stockBadge(LOW_STOCK + 1)).toEqual({ label: 'Còn hàng', tone: 'ok' });
});

describe('fetchInventory', () => {
  test('GET /admin/products kèm Bearer', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, [{ id: 'p1', name: 'Latte', price: 35000, stock: 0, version: 1 }]));
    vi.stubGlobal('fetch', f);
    expect((await fetchInventory('tok'))[0].stock).toBe(0);
    expect(f.mock.calls[0][0]).toMatch(/\/admin\/products$/);
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });
  test('403 → báo cần tài khoản quản trị', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(403, {})));
    await expect(fetchInventory('tok')).rejects.toThrow(/quản trị/);
  });
});

describe('adjustStock', () => {
  test('PATCH /admin/products/:id/stock với body {mode,value,version}', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(200, { id: 'p1', name: 'Latte', price: 35000, stock: 15, version: 2 }));
    vi.stubGlobal('fetch', f);
    const p = await adjustStock('tok', 'p1', { mode: 'delta', value: 5, version: 1 });
    expect(p.stock).toBe(15);
    const [url, init] = f.mock.calls[0];
    expect(url).toMatch(/\/admin\/products\/p1\/stock$/);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ mode: 'delta', value: 5, version: 1 });
  });
  test('409 → báo dữ liệu đã đổi, tải lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(409, { message: 'Stock changed, reload' })));
    await expect(adjustStock('tok', 'p1', { mode: 'set', value: 1, version: 1 })).rejects.toThrow(/vừa thay đổi/);
  });
  test('400 → báo không được âm', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(400, { message: 'Stock cannot be negative' })));
    await expect(adjustStock('tok', 'p1', { mode: 'delta', value: -99, version: 1 })).rejects.toThrow(/âm/);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd frontend && npx vitest run src/lib/admin.test.ts`
Expected: FAIL (`Failed to resolve import "./admin"`).

- [ ] **Step 3: `lib/admin.ts`**

```ts
// ============================================================
// FEATURE: Màn tồn kho (UC14, mở rộng ngoài MVP §3.2). Chỉ Product.stock, không CRUD món.
// ============================================================
import { API_BASE } from './api';

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  version: number;
  imageUrl?: string;
}

export const LOW_STOCK = 3;

export function stockBadge(stock: number): { label: string; tone: 'out' | 'low' | 'ok' } {
  if (stock <= 0) return { label: 'Hết hàng', tone: 'out' };
  if (stock <= LOW_STOCK) return { label: 'Sắp hết', tone: 'low' };
  return { label: 'Còn hàng', tone: 'ok' };
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    throw new Error('Không kết nối được máy chủ (tồn kho).');
  }
  if (res.status === 401) throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
  if (res.status === 403) throw new Error('Trang này cần tài khoản quản trị (Admin).');
  if (res.status === 409) throw new Error('Tồn kho vừa thay đổi (có đơn mới hoặc người khác sửa). Đã tải lại, hãy thử lại.');
  if (res.status === 400) throw new Error('Tồn kho không được âm.');
  if (!res.ok) throw new Error(`Thao tác tồn kho lỗi (mã ${res.status}).`);
  return res.json();
}

export const fetchInventory = (token: string) => call<InventoryItem[]>(token, '/admin/products');

export const adjustStock = (token: string, id: string, body: { mode: 'set' | 'delta'; value: number; version: number }) =>
  call<InventoryItem>(token, `/admin/products/${encodeURIComponent(id)}/stock`, { method: 'PATCH', body: JSON.stringify(body) });
```

- [ ] **Step 4: Trang `app/admin/page.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatVND } from '@/lib/pricing';
import { getToken, roleFromToken } from '@/lib/auth';
import { adjustStock, fetchInventory, stockBadge, type InventoryItem } from '@/lib/admin';

// FEATURE: Màn tồn kho (UC14, mở rộng §3.2): xem mọi món kể cả hết hàng, đặt số hoặc cộng/trừ.
const TONE: Record<'out' | 'low' | 'ok', string> = { out: '#b91c1c', low: '#92400e', ok: '#065f46' };

export default function AdminPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setToken(getToken()), []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await fetchInventory(token));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function change(p: InventoryItem, body: { mode: 'set' | 'delta'; value: number }) {
    if (!token) return;
    setBusyId(p.id);
    try {
      const updated = await adjustStock(token, p.id, { ...body, version: p.version });
      setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      setDraft((d) => ({ ...d, [p.id]: '' }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (token === undefined) return null;
  if (roleFromToken(token) !== 'ADMIN')
    return (
      <section>
        <h1>Quản lý tồn kho</h1>
        <p>Trang này dành cho quản trị. <Link href="/login">Đăng nhập</Link> bằng admin@brewlite.vn.</p>
      </section>
    );

  return (
    <section>
      <h1>Quản lý tồn kho</h1>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      <table style={styles.table}>
        <thead>
          <tr><th style={styles.th}>Món</th><th style={styles.th}>Giá</th><th style={styles.th}>Tồn kho</th><th style={styles.th}>Điều chỉnh</th></tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const b = stockBadge(p.stock);
            const busy = busyId === p.id;
            const n = Number(draft[p.id]);
            return (
              <tr key={p.id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{formatVND(p.price)}</td>
                <td style={styles.td}>
                  <strong>{p.stock}</strong> <span style={{ color: TONE[b.tone], fontSize: 12 }}>{b.label}</span>
                </td>
                <td style={styles.td}>
                  <button disabled={busy || p.stock <= 0} onClick={() => change(p, { mode: 'delta', value: -1 })}>−1</button>{' '}
                  <button disabled={busy} onClick={() => change(p, { mode: 'delta', value: 1 })}>+1</button>{' '}
                  <button disabled={busy} onClick={() => change(p, { mode: 'delta', value: 10 })}>+10</button>{' '}
                  <input
                    type="number" min={0} step={1} placeholder="Đặt số" style={{ width: 80 }}
                    value={draft[p.id] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  />{' '}
                  <button disabled={busy || draft[p.id] === undefined || draft[p.id] === '' || !Number.isInteger(n) || n < 0} onClick={() => change(p, { mode: 'set', value: n })}>
                    Lưu
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: 8 },
  td: { borderBottom: '1px solid #f1f5f9', padding: 8 },
};
```

- [ ] **Step 5: Chạy test + build**

Run: `cd frontend && npx vitest run && npx tsc --noEmit && npm run build`
Expected: PASS, build có route `/admin`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/admin.ts frontend/src/lib/admin.test.ts frontend/src/app/admin
git commit -m "feat(frontend): man ton kho /admin - xem ca mon het hang, dat so/cong tru, bao 409 khi kho vua doi"
```

---

### Task 8: Docs đồng bộ (Use Case gốc ↔ sequence ↔ code)

**Files:**
- Modify: `docs/use-case-specifications.md`, `docs/user-sequence-specifications.md`, `docs/BrewLite-CongNghePhanMem-fixed.md`, `README.md`, `docs/develop-status-report.md`

**Interfaces:**
- Consumes: tên UC trên **Bản 1** của `use-case-specifications.md` (biểu đồ gốc). Mọi chỗ khác phải dùng nguyên văn tên đó.

- [ ] **Step 1: `docs/use-case-specifications.md` (Bản 1 là gốc)**

Sửa đúng những chỗ đang lệch quyết định Q1–Q5 (người dùng đã đưa lại 16 UC):
1. Bản 1: đổi nhãn package `"Phân hệ Pha chế (Barista Subsystem)"` → `"Phân hệ Pha chế (Barista) – mở rộng ngoài MVP §3.2"`, `"Phân hệ Quản trị (Admin Subsystem)"` → `"Phân hệ Quản trị (Admin) – mở rộng ngoài MVP §3.2"`; đổi `"UC12: Hủy đơn do hết món\n(PAID -> CANCELLED)"` → `"UC12: Hủy đơn do hết nguyên liệu\n(PAID -> CANCELLED)"`; đổi `"UC14: Quản lý tồn kho (Stock)"` → `"UC14: Kiểm & điều chỉnh tồn kho món"`; thêm `UC12 --- Gateway` (hoàn tiền). UC13, UC15 giữ trên biểu đồ nhưng thêm vào nhãn `\n(chưa hiện thực)`.
2. Mục 1, dòng Admin: thay mô tả bằng "Kiểm và điều chỉnh tồn kho món (`Product.stock`), chưa có quản lý thực đơn / voucher (UC13, UC15 là backlog)"; dòng Barista giữ.
3. "Lưu ý về phạm vi": viết lại — Khách hàng: MVP 10 task; Pha chế UC08–UC12 + Quản trị UC14: **đã hiện thực, mở rộng ngoài đề §3.2**, vai trò qua `User.role` + `RolesGuard`; UC13, UC15: **chưa hiện thực (backlog §11.4)**, UC15 còn trái chốt voucher nội bộ của nhóm.
4. Bảng mục 4:
   - UC06: "Hủy đơn `PENDING` / `PAYMENT_FAILED` / `PAID` (nút Hủy ở `/history`, `PAID` có hoàn tiền + hoàn kho) hoặc thanh toán lại đơn `PAYMENT_FAILED`. Khách **không** tự tiến đơn (403)."
   - UC08: căn cứ `GET /orders?status=PAID,PREPARING,READY` (JWT + BARISTA/ADMIN), màn `/barista` 3 cột; sơ đồ `§2.7`.
   - UC09/UC10/UC11: căn cứ `PATCH /orders/:id {PREPARING|READY|COMPLETED}` chỉ BARISTA/ADMIN, nút Nhận pha / Pha xong / Đã giao; sơ đồ `§2.7`.
   - UC12: tác nhân `Barista`, `Mock Gateway`; `PATCH /orders/:id {CANCELLED}` bởi BARISTA/ADMIN, chỉ từ `PAID` (state machine chặn từ `PREPARING`), hoàn đúng số thực thu + hoàn kho; sơ đồ `§2.7`.
   - UC13, UC15: cột căn cứ "**Chưa hiện thực** (backlog)"; cột sơ đồ "—".
   - UC14: "Kiểm & điều chỉnh tồn kho món: `GET /admin/products` (kể cả món hết hàng), `PATCH /admin/products/:id/stock {mode: set|delta, value, version}` chỉ ADMIN, optimistic lock theo `version` (409 khi kho vừa đổi), không âm (400). Không có bảng nguyên liệu." ; sơ đồ `§2.8`.
5. Bản 2: đổi câu mô tả "khớp 100% với các sơ đồ tuần tự" → "trích phân hệ Khách hàng từ Bản 1 (gốc), dùng khi thuyết trình MVP".
6. Mục 5.2 Câu 4: viết lại — 3 phân hệ; MVP là phân hệ Khách hàng; nhóm mở rộng Pha chế + Kho để state machine §9.1 có người vận hành thật thay vì khách tự bấm; UC13/UC15 là backlog.

- [ ] **Step 2: `docs/user-sequence-specifications.md`**

1. Phần I mục 1.2 "Tác nhân": thêm `Nhân viên pha chế (Barista)` ở UC08–UC12, `Quản trị viên (Admin)` ở UC14.
2. Bảng "Đồng bộ với biểu đồ Use Case gốc" ở đầu Phần II: thêm 6 dòng UC08, UC09, UC10, UC11, UC12 (→ §2.7), UC14 (→ §2.8) với đúng tên Bản 1; đổi câu "6 sơ đồ cho 8 UC" → "8 sơ đồ cho 14 UC đã hiện thực (UC13, UC15 chưa hiện thực nên chưa có sơ đồ)"; xóa câu "Không có sơ đồ nào cho chức năng ngoài 8 UC này".
3. §2.5: xóa Kịch bản 4 "Quầy (demo)" khỏi mục A và khỏi `alt` trong sơ đồ tuần tự; xóa dòng "Barista hủy đơn khi hết nguyên liệu: ngoài phạm vi MVP… không có trên biểu đồ Use Case gốc" và `note over User, FE : Barista hủy đơn: ngoài MVP…`; thay bằng một dòng "Barista hủy đơn hết nguyên liệu: UC12, xem §2.7". Mục C: `PATCH /orders/:id` — khách chỉ `CANCELLED` đơn của mình; `PREPARING/READY/COMPLETED` chỉ BARISTA/ADMIN (khách 403).
4. Sơ đồ trạng thái B2 trong §2.5: đổi nhãn 3 mũi tên `nút "Quầy (demo)"` → `Barista: Nhận pha (UC09)`, `Barista: Pha xong (UC10)`, `Barista: Đã giao (UC11)`; mũi tên `PAID --> CANCELLED` → `khách hủy (UC06) / Barista hủy hết nguyên liệu (UC12)\n(hoàn tiền + hoàn kho)`; xóa note "Quầy (demo) mô phỏng Barista: ngoài MVP".
5. Thêm **§2.7 UC08–UC12: Quầy pha chế (Barista)** sau §2.6, gồm A (bối cảnh), B (sơ đồ dưới), C (bảng kỹ thuật: endpoint, `OrderService.listQueue`, `PaymentService.advanceOrder/cancelOrderAs(actor…)`, `RolesGuard`, `assertTransition`, polling 5 giây):

```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Nhân viên pha chế\n(Barista)" as User
participant "Giao diện Web\n(Frontend /barista)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB
participant "Cổng thanh toán\n(Mock Gateway)" as Gateway

== UC08: Xem hàng đợi đơn (tự tải lại mỗi 5 giây) ==
User -> FE : Mở trang Quầy (đăng nhập barista@brewlite.vn)
activate FE
FE -> BE : GET /orders?status=PAID,PREPARING,READY + Bearer JWT
activate BE
BE -> BE : JwtAuthGuard + RolesGuard (BARISTA/ADMIN, khách -> 403)
BE -> DB : Đơn PAID / PREPARING / READY, cũ trước + tên món
activate DB
DB --> BE : Danh sách đơn
deactivate DB
BE --> FE : 200 hàng đợi
deactivate BE
FE --> User : 3 cột: Chờ pha | Đang pha | Sẵn sàng
deactivate FE

== UC09 / UC10 / UC11: Nhận pha -> Pha xong -> Đã giao ==
User -> FE : Bấm "Nhận pha" (rồi "Pha xong", "Đã giao")
activate FE
FE -> BE : PATCH /orders/:id { status: PREPARING | READY | COMPLETED }
activate BE
BE -> BE : Vai trò BARISTA/ADMIN (khách -> 403)
BE -> BE : assertTransition (sai thứ tự -> 400)
BE -> DB : Cập nhật trạng thái đơn
BE --> FE : 200 đơn mới
deactivate BE
FE --> User : Đơn chuyển sang cột kế tiếp
deactivate FE

== UC12: Hủy đơn do hết nguyên liệu (chỉ cột Chờ pha) ==
User -> FE : Bấm "Hủy (hết nguyên liệu)" và xác nhận
activate FE
FE -> BE : PATCH /orders/:id { status: CANCELLED }
activate BE
BE -> BE : assertTransition(PAID -> CANCELLED)\n(từ PREPARING trở đi -> 400)
BE -> Gateway : Hoàn đúng số tiền thực thu
activate Gateway
Gateway --> BE : Hoàn tiền thành công
deactivate Gateway
BE -> DB : 1 transaction: hoàn kho các món + CANCELLED
BE --> FE : 200 đơn đã hủy
deactivate BE
FE --> User : Đơn rời hàng đợi
deactivate FE
@enduml
```

6. Thêm **§2.8 UC14: Kiểm & điều chỉnh tồn kho món (Admin)**, gồm A, B (sơ đồ dưới), C (`GET /admin/products`, `PATCH /admin/products/:id/stock`, `AdjustStockDto`, `ProductService.adjustStock`, `setStockWithOptimisticLock`, 409/400):

```plantuml
@startuml
skinparam DefaultFontColor #1f2937
skinparam ArrowColor #5b6b8c
skinparam SequenceParticipantBackgroundColor #eef2fb
skinparam SequenceParticipantBorderColor #5b6b8c
skinparam SequenceLifeLineBorderColor #5b6b8c

autonumber
actor "Quản trị viên\n(Admin)" as User
participant "Giao diện Web\n(Frontend /admin)" as FE
participant "Máy chủ xử lý\n(Backend)" as BE
database "Cơ sở dữ liệu" as DB

User -> FE : Mở trang Kho (đăng nhập admin@brewlite.vn)
activate FE
FE -> BE : GET /admin/products + Bearer JWT
activate BE
BE -> BE : JwtAuthGuard + RolesGuard (chỉ ADMIN, barista/khách -> 403)
BE -> DB : Mọi món, kể cả stock = 0
DB --> BE : Danh sách món (stock, version)
BE --> FE : 200
deactivate BE
FE --> User : Bảng tồn kho + nhãn Hết hàng / Sắp hết
deactivate FE

User -> FE : Bấm "+10" (hoặc nhập số rồi "Lưu")
activate FE
FE -> BE : PATCH /admin/products/:id/stock { mode, value, version }
activate BE
alt version lệch (vừa có đơn trừ kho / người khác sửa)
  BE --> FE : 409 Stock changed, reload
  FE -> BE : GET /admin/products (tải lại)
  FE --> User : Báo kho vừa đổi, thử lại trên số mới
else kết quả âm
  BE --> FE : 400 Stock cannot be negative
  FE --> User : Báo tồn kho không được âm
else hợp lệ
  BE -> DB : UPDATE stock, version + 1 WHERE version khớp
  BE --> FE : 200 món đã cập nhật
  FE --> User : Cập nhật dòng trong bảng
end
deactivate BE
deactivate FE
@enduml
```

7. Phần III: thêm dòng UC08–UC12 và UC14 vào ma trận (endpoint, controller/service, bảng, cơ chế); sửa dòng UC06 (khách chỉ hủy); xóa câu "Barista / Admin: ngoài phạm vi MVP… không có sơ đồ tuần tự".

- [ ] **Step 3: `BrewLite-CongNghePhanMem-fixed.md`, README, status report**

- `fixed.md` §12.1 ghi chú của nhóm: thêm 3 dòng `GET /orders?status=` (UC08, BARISTA/ADMIN), `GET /admin/products` và `PATCH /admin/products/:id/stock` (UC14, ADMIN); sửa dòng `PATCH /orders/:id` thành "khách: hủy đơn của mình; BARISTA/ADMIN: tiến đơn + hủy đơn PAID"; xóa câu "Không có `GET /orders?status=PAID`…". §12.2 ghi chú: thêm `User.role` (CUSTOMER/BARISTA/ADMIN). KHÔNG sửa phần chép từ đề gốc.
- `README.md`: bảng tài khoản demo (khách / quầy / quản trị + mật khẩu), mục API thêm 3 endpoint, mục "Demo State Machine" đổi sang: đăng nhập barista → `/barista` bấm Nhận pha → Pha xong → Đã giao; thêm "Demo tồn kho": admin → `/admin`.
- `docs/develop-status-report.md`: thêm mục "Mở rộng ngoài đề: Barista + Admin" (tóm tắt + số test mới).

- [ ] **Step 4: Render + kiểm đồng bộ tên**

Run (Git Bash):

```bash
# plantuml.jar bản 1.2026.8 tải từ GitHub releases plantuml/plantuml (kiểm sha256 theo trang release), để NGOÀI repo
J=${PLANTUML_JAR:?đặt PLANTUML_JAR=/đường/dẫn/plantuml-1.2026.8.jar}
D=$(mktemp -d)
python -I -X utf8 -c "
import re,sys
n=0
for f in ['docs/use-case-specifications.md','docs/user-sequence-specifications.md']:
    for b in re.findall(r'\`\`\`plantuml\n(.*?)\`\`\`', open(f,encoding='utf-8').read(), re.S):
        n+=1; open(f'{sys.argv[1]}/d{n:02d}.puml','w',encoding='utf-8').write(b)
print('blocks',n)" "$D"
PLANTUML_SECURITY_PROFILE=SANDBOX java -jar "$J" -tsvg -charset UTF-8 -failfast2 "$D"/*.puml; echo "exit $?"
```

Expected: `blocks 11` (use case: Bản 1 + Bản 2 = 2; sequence: §2.1–§2.6 = 6, sơ đồ trạng thái §2.5 = 1, §2.7 = 1, §2.8 = 1), `exit 0`. Rồi kiểm mọi nhãn `UCxx: …` của Bản 1 (trừ UC13, UC15) xuất hiện nguyên văn trong `user-sequence-specifications.md`, và `grep -n "Quầy (demo)" docs README.md` chỉ còn trong lịch sử thay đổi (nếu có), không còn ở mô tả hiện trạng.

- [ ] **Step 5: Commit**

```bash
git add docs README.md
git commit -m "docs: dong bo Barista/Admin - use case goc (UC08-UC12, UC14 hien thuc; UC13, UC15 backlog), sequence §2.7 §2.8, so do trang thai"
```

---

### Task 9: Script demo + kiểm chứng trên stack thật

**Files:**
- Modify: `scripts/demo-state-machine.sh`

- [ ] **Step 1: Script dùng 2 tài khoản**

Trong `scripts/demo-state-machine.sh`: giữ đăng nhập `demo@brewlite.vn` (khách) để tạo đơn + thanh toán; thêm biến `STAFF_EMAIL="${STAFF_EMAIL:-barista@brewlite.vn}"`, `STAFF_PASSWORD="${STAFF_PASSWORD:-barista1234}"`, đăng nhập lấy `STAFF_TOKEN`; các bước `PATCH PREPARING/READY/COMPLETED` và bước cố tình sai `COMPLETED → CANCELLED` gửi bằng `STAFF_TOKEN`. Thêm 1 bước trước đó: khách tự `PATCH {PREPARING}` phải ra **403** (`expect "$code" 403 "khách tự tiến đơn"`). Đọc lại trạng thái (`GET /orders/:id`) bằng token khách.

- [ ] **Step 2: Build lại stack (migration + seed chạy khi container khởi động)**

Run: `docker compose up -d --build` rồi chờ `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/products` ra `200`.
Kiểm: `docker compose exec -T db psql -U brewlite -d brewlite -c 'select email, role from "User" order by email;'` có `admin@brewlite.vn | ADMIN`, `barista@brewlite.vn | BARISTA`, `demo@brewlite.vn | CUSTOMER`.

- [ ] **Step 3: Chạy script**

Run: `bash scripts/demo-state-machine.sh`
Expected: `PENDING → PAID`, khách tự tiến đơn 403, barista `PREPARING → READY → COMPLETED`, chuyển sai 400, exit 0.

- [ ] **Step 4: Smoke API tồn kho + quyền**

Run (thay `$ADMIN`, `$BARISTA`, `$CUSTOMER` bằng `accessToken` đăng nhập 3 tài khoản):

```bash
curl -s -o /dev/null -w "customer GET /orders: %{http_code}\n" -H "Authorization: Bearer $CUSTOMER" "http://localhost:3000/orders?status=PAID"   # 403
curl -s -o /dev/null -w "barista GET /admin/products: %{http_code}\n" -H "Authorization: Bearer $BARISTA" http://localhost:3000/admin/products  # 403
V=$(curl -s -H "Authorization: Bearer $ADMIN" http://localhost:3000/admin/products | python -I -c "import json,sys; print(next(p['version'] for p in json.load(sys.stdin) if p['id']=='p4'))")   # 200, lấy version của p4
curl -s -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN" -d "{\"mode\":\"delta\",\"value\":5,\"version\":$V}" http://localhost:3000/admin/products/p4/stock   # 200, stock +5, version = V+1
curl -s -o /dev/null -w "version cũ: %{http_code}\n" -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN" -d '{"mode":"set","value":1,"version":1}' http://localhost:3000/admin/products/p4/stock   # 409
```

- [ ] **Step 5: Kiểm thử bằng mắt (người dùng)**

Trên `http://localhost:3001`: (1) khách đặt + trả 1 đơn → `/history` KHÔNG có nút "Quầy (demo)"; (2) đăng nhập barista → tự vào `/barista`, đơn ở cột "Chờ pha", bấm Nhận pha → Pha xong → Đã giao; `/history` của khách thấy thanh tiến trình đi tới "Hoàn tất"; (3) đăng nhập admin → `/admin`, +10 một món hết hàng → món hiện lại ở menu khách.

- [ ] **Step 6: Toàn bộ test + commit**

Run: `cd backend && npx jest && npx tsc --noEmit -p .`; `DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite npx jest test/pg-payment.integration.spec.ts`; `cd ../frontend && npx vitest run && npx tsc --noEmit && npm run build`.
Expected: tất cả xanh.

```bash
git add scripts/demo-state-machine.sh
git commit -m "chore(demo): script state machine dung tai khoan barista, kiem khach tu tien don bi 403"
```

---

## Ngoài phạm vi (không làm trong plan này)

- UC13 Quản lý món & thực đơn (CRUD), UC15 Quản lý mã giảm giá (trái chốt voucher nội bộ) — backlog §11.4.
- Bảng nguyên liệu / ngưỡng an toàn, thông báo realtime (WebSocket), in phiếu, phân trang hàng đợi.
- Trang quản lý tài khoản nhân viên (tài khoản quầy/quản trị chỉ tạo qua seed).
