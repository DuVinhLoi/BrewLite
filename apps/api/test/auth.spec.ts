import { sign } from 'jsonwebtoken';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

describe('UNIT-S2-05: JWT and HTTP boundary', () => {
  let app: INestApplication; let auth: AuthService;
  const previousSecret = process.env.JWT_SECRET;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'unit-test-only-secret-at-least-32-characters';
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue({}).compile();
    app = module.createNestApplication(); configureApp(app); await app.init(); auth = module.get(AuthService);
  });
  afterAll(async () => { await app.close(); if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret; });
  it('accepts signed token and rejects tampering, missing token, and expired JWT', async () => {
    const token = auth.token({ sub: 'u1', role: 'CUSTOMER' });
    expect(auth.authenticate(`Bearer ${token}`)).toEqual({ sub: 'u1', role: 'CUSTOMER' });
    const parts = token.split('.'); parts[1] = Buffer.from('{"sub":"attacker","role":"CUSTOMER","exp":1}').toString('base64url');
    expect(() => auth.authenticate(`Bearer ${parts.join('.')}`)).toThrow();
    await request(app.getHttpServer()).post('/orders').send({ items: [] }).expect(401);
    await request(app.getHttpServer()).get('/orders/me').set('Authorization', 'Bearer invalid').expect(401);
  });
  it('rejects an expired signed JWT and reports DB-down health without internals', async () => {
    const expired = sign({ role: 'CUSTOMER' }, process.env.JWT_SECRET!, { subject: 'u1', expiresIn: -1, issuer: 'brewlite', audience: 'brewlite-api' });
    expect(() => auth.authenticate(`Bearer ${expired}`)).toThrow();
    const health = await request(app.getHttpServer()).get('/health').expect(503);
    expect(health.body).toEqual({ status: 'error', database: 'down' });
  });
  it('rejects a barista and injected public roles before DB access', async () => {
    await request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${auth.token({ sub: 'b', role: 'BARISTA' })}`).send({ items: [] }).expect(403);
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'a@a.test', password: 'Password123', role: 'BARISTA' }).expect(400);
  });
  it('rejects missing payment key and client supplied totals', async () => {
    const token = auth.token({ sub: 'u1', role: 'CUSTOMER' });
    await request(app.getHttpServer()).post('/payments').set('Authorization', `Bearer ${token}`).send({ orderId: 'o', paymentMethod: 'WALLET' }).expect(400);
    await request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${token}`).send({ items: [], total: 1 }).expect(400);
  });
});