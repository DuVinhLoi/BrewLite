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

  test('DTO: value vượt Int32 bị từ chối, đúng biên thì nhận', async () => {
    const errs = async (o: object) => (await validate(plainToInstance(AdjustStockDto, o))).length;
    expect(await errs({ mode: 'set', value: 2147483647, version: 1 })).toBe(0);
    expect(await errs({ mode: 'delta', value: -2147483648, version: 1 })).toBe(0);
    expect(await errs({ mode: 'set', value: 2147483648, version: 1 })).toBeGreaterThan(0);
    expect(await errs({ mode: 'delta', value: -2147483649, version: 1 })).toBeGreaterThan(0);
  });

  test('cộng dồn vượt Int32 (mỗi value hợp lệ) → 400 Stock too large, kho không đổi', async () => {
    const { svc, repo } = await setup();
    const err = await svc.adjustStock('p1', { mode: 'delta', value: 2147483647, version: 3 }).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.message).toBe('Stock too large');
    expect((await repo.findById('p1'))!.stock).toBe(10);
  });

  test('controller chỉ ADMIN (BARISTA bị 403)', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminProductController)).toEqual([JwtAuthGuard, RolesGuard]);
    const guard = new RolesGuard(new Reflector());
    const ctx = (role: Role) => ({ getHandler: () => AdminProductController.prototype.list, getClass: () => AdminProductController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as any;
    expect(guard.canActivate(ctx(Role.ADMIN))).toBe(true);
    expect(() => guard.canActivate(ctx(Role.BARISTA))).toThrow(ForbiddenException);
  });
});
