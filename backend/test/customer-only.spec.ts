import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '../src/contracts/user.contract';
import { OrderController } from '../src/order/order.controller';
import { PaymentController } from '../src/payment/payment.controller';
import { UserController } from '../src/auth/user.controller';
import { RolesGuard } from '../src/auth/roles.guard';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

// 5 customer-only handlers: staff tokens must get 403 before any business logic
const handlers: [string, any, Function][] = [
  ['POST /orders', OrderController, OrderController.prototype.create],
  ['GET /orders/me', OrderController, OrderController.prototype.mine],
  ['GET /orders/:id', OrderController, OrderController.prototype.byId],
  ['POST /payments', PaymentController, PaymentController.prototype.pay],
  ['GET /users/me', UserController, UserController.prototype.me],
];

const ctx = (cls: any, handler: Function, role: Role) =>
  ({ getHandler: () => handler, getClass: () => cls, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) }) as any;

describe.each(handlers)('%s chỉ dành cho CUSTOMER', (_name, cls, handler) => {
  const guard = new RolesGuard(new Reflector());

  test('gắn JwtAuthGuard + RolesGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([JwtAuthGuard, RolesGuard]);
  });

  test('CUSTOMER qua', () => {
    expect(guard.canActivate(ctx(cls, handler, Role.CUSTOMER))).toBe(true);
  });

  test.each([Role.BARISTA, Role.ADMIN])('%s bị 403', (role) => {
    expect(() => guard.canActivate(ctx(cls, handler, role))).toThrow(ForbiddenException);
  });
});
