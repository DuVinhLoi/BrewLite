// UNIT-T06: real validation and bcrypt; only the Prisma write is replaced.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, getRounds } from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('UNIT-T06 registration', () => {
  const valid = { email: 'unit.customer@example.test', password: 'FakePass123' };
  // Invalid input must fail before any Prisma operation. No client is constructed.
  const validationOnly = new AuthService({} as PrismaService);
  const invalidBodies: [string, unknown][] = [
    ['null body', null],
    ['missing email', { password: valid.password }],
    ['email without domain', { ...valid, email: 'customer@' }],
    ['email with whitespace', { ...valid, email: 'customer name@example.test' }],
    ['email without @', { ...valid, email: 'customer.example.test' }],
    ['injection-shaped email', { ...valid, email: "' OR 1=1 --" }],
    ['empty password', { ...valid, password: '' }],
    ['seven-character password', { ...valid, password: 'Abc1234' }],
    ['password without digits', { ...valid, password: 'abcdefgh' }],
    ['password without letters', { ...valid, password: '12345678' }],
    ['password above bcrypt byte limit', { ...valid, password: 'A1' + 'é'.repeat(36) }],
    ['caller-supplied role', { ...valid, role: 'BARISTA' }],
  ];
  for (const [name, body] of invalidBodies) {
    it(`rejects ${name} with 400 VALIDATION_ERROR`, async () => {
      await assert.rejects(validationOnly.register(body), (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.equal(error.getStatus(), 400);
        const response = error.getResponse() as { code: string; details: string[] };
        assert.equal(response.code, 'VALIDATION_ERROR');
        assert.ok(response.details.length > 0);
        return true;
      });
    });
  }

  for (const password of ['Abc12345', 'A1' + 'é'.repeat(35)]) {
    it(`hashes a valid ${Buffer.byteLength(password)}-byte password and returns only public user fields`, async () => {
      let savedHash = '';
      const prisma = {
        user: {
          async create(args: Prisma.UserCreateArgs) {
            // Verify the real write boundary rather than returning an unconditionally safe fake.
            assert.deepEqual(args.select, { id: true, email: true, role: true });
            assert.deepEqual(Object.keys(args.data).sort(), ['email', 'passwordHash']);
            assert.equal(args.data.email, 'unit.customer@example.test');
            savedHash = args.data.passwordHash;
            const stored = { id: 'unit-customer', email: args.data.email, role: 'CUSTOMER', passwordHash: savedHash };
            return Object.fromEntries(Object.entries(stored).filter(([key]) => args.select?.[key as keyof typeof args.select]));
          },
        },
      };
      const service = new AuthService(prisma as unknown as PrismaService);
      const result = await service.register({ email: 'UNIT.CUSTOMER@EXAMPLE.TEST', password });
      assert.notEqual(savedHash, password);
      assert.match(savedHash, /^\$2[aby]\$/);
      assert.ok(getRounds(savedHash) >= 10);
      assert.equal(await compare(password, savedHash), true);
      assert.deepEqual(result, { id: 'unit-customer', email: 'unit.customer@example.test', role: 'CUSTOMER' });
      assert.equal(Object.hasOwn(result, 'passwordHash'), false);
      assert.equal(Object.hasOwn(result, 'password'), false);
    });
  }
});
