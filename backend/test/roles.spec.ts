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
