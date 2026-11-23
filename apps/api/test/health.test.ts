// API-T03 (unit half): AC-N15.2. The controller receives PrismaService by constructor injection, so a stub replaces the database.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Response } from 'express';
import { HealthController } from '../src/checkout/checkout.controller';
import type { PrismaService } from '../src/prisma/prisma.service';

function probe(queryRaw: () => Promise<unknown>) {
  const statuses: number[] = [];
  const response = { status: (code: number) => { statuses.push(code); return response; } } as unknown as Response;
  const controller = new HealthController({ $queryRaw: queryRaw } as unknown as PrismaService);
  return { statuses, call: () => controller.health(response) };
}

describe('API-T03 health depends on the database (AC-N15.2)', () => {
  it('returns 503 with status error and database down when the DB check fails', async () => {
    const { statuses, call } = probe(async () => { throw new Error('connection refused'); });
    assert.deepEqual(await call(), { status: 'error', database: 'down' });
    assert.deepEqual(statuses, [503]);
  });
  it('keeps the default 200 with database up when the DB check succeeds', async () => {
    const { statuses, call } = probe(async () => [{ '?column?': 1 }]);
    assert.deepEqual(await call(), { status: 'ok', database: 'up' });
    assert.deepEqual(statuses, []);
  });
});
