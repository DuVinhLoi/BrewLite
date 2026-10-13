import 'reflect-metadata';
import { ExecutionContext, INestApplication, Module, Provider, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaUserRepo } from '../src/prisma/prisma-user.repo';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { RegisterDto, LoginDto } from '../src/auth/dto';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { InMemoryUserRepo } from '../src/stubs/in-memory-user.repo';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';

const secret = 'task47-test-secret';
const jwt = new JwtService({ secret, signOptions: { expiresIn: '1h' } });
const context = (authorization?: string) => ({
  switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
}) as ExecutionContext;

describe('Task 7 regression', () => {
  test('register and login normalize email; mixed-case duplicate returns 409', async () => {
    const repo = new InMemoryUserRepo();
    const auth = new AuthService(repo, jwt);
    const registered = await auth.register({ email: '  Customer@Example.COM  ', password: 'secret123' });
    expect(registered.email).toBe('customer@example.com');
    await expect(auth.register({ email: 'CUSTOMER@example.com', password: 'secret123' })).rejects.toMatchObject({ status: 409 });
    const login = await auth.login({ email: ' CUSTOMER@EXAMPLE.COM ', password: 'secret123' });
    expect(login.user.id).toBe(registered.id);
    const payload = await jwt.verifyAsync(login.accessToken);
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(payload).not.toHaveProperty('passwordHash');
    expect(payload).not.toHaveProperty('password');
  });

  test('previously stored mixed-case email still logs in and cannot register again', async () => {
    const repo = new InMemoryUserRepo();
    await repo.save({ id: 'legacy', email: 'Legacy@Example.COM', passwordHash: await bcrypt.hash('secret123', 10), loyaltyPoints: 0 });
    const auth = new AuthService(repo, jwt);
    const login = await auth.login({ email: 'legacy@example.com', password: 'secret123' });
    expect(login.user.id).toBe('legacy');
    await expect(auth.register({ email: 'LEGACY@example.com', password: 'secret123' })).rejects.toMatchObject({ status: 409 });
  });

  test('Prisma uniqueness race returns 409 instead of leaking database error', async () => {
    const repo = new InMemoryUserRepo();
    jest.spyOn(repo, 'save').mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });
    await expect(new AuthService(repo, jwt).register({ email: 'race@example.com', password: 'secret123' })).rejects.toMatchObject({ status: 409 });
  });

  test('unrelated save errors remain errors', async () => {
    const repo = new InMemoryUserRepo();
    const failure = new Error('database unavailable');
    jest.spyOn(repo, 'save').mockRejectedValue(failure);
    await expect(new AuthService(repo, jwt).register({ email: 'race@example.com', password: 'secret123' })).rejects.toBe(failure);
  });

  test.each([RegisterDto, LoginDto])('DTO normalizes email before validating', async (Dto) => {
    const dto = plainToInstance(Dto, { email: '  USER@Example.COM ', password: 'secret123' });
    expect(dto.email).toBe('user@example.com');
    expect(await validate(dto)).toHaveLength(0);
    expect(await validate(plainToInstance(Dto, { email: 42, password: 'secret123' }))).not.toHaveLength(0);
  });

  test.each([{ email: 'a@b.co' }, { sub: '', email: 'a@b.co' }, { sub: 42, email: 'a@b.co' }, { sub: 'u1' }, { sub: 'u1', email: 42 }])('signed token with invalid identity %j is rejected', async (payload) => {
    await expect(new JwtAuthGuard(jwt).canActivate(context(`Bearer ${jwt.sign(payload)}`))).rejects.toMatchObject({ status: 401 });
  });

  test('expired or wrong-signature JWT is rejected', async () => {
    const guard = new JwtAuthGuard(jwt);
    const payload = { sub: 'u1', email: 'a@b.co' };
    await expect(guard.canActivate(context(`Bearer ${jwt.sign(payload, { expiresIn: -1 })}`))).rejects.toMatchObject({ status: 401 });
    await expect(guard.canActivate(context(`Bearer ${jwt.sign(payload, { secret: 'other-secret' })}`))).rejects.toMatchObject({ status: 401 });
  });
});

// Reuse production auth wiring, overriding only its repository in this isolated test module.
// DATABASE_URL must never cause these HTTP tests to connect to a real/shared database.
const authProviders: Provider[] = Reflect.getMetadata('providers', AuthModule);
@Module({
  imports: Reflect.getMetadata('imports', AuthModule),
  controllers: Reflect.getMetadata('controllers', AuthModule),
  providers: authProviders.map((provider) => provider === PrismaUserRepo ? { provide: PrismaUserRepo, useClass: InMemoryUserRepo } : provider),
  exports: Reflect.getMetadata('exports', AuthModule),
})
class InMemoryAuthModule {}

// Exercise Nest routing, ValidationPipe, HTTP status and the existing order guard without a database.
const create = jest.fn(async (userId: string) => ({ id: 'test-order', userId, isCached: false }));
@Module({ imports: [InMemoryAuthModule], controllers: [OrderController], providers: [{ provide: OrderService, useValue: { create } }] })
class HttpTestModule {}

describe('Task 7 HTTP integration (in-memory auth, order service spy)', () => {
  let app: INestApplication;
  let base: string;
  const previousSecret = process.env.JWT_SECRET;

  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    app = await NestFactory.create(HttpTestModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  });
  afterAll(async () => {
    await app?.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const post = (route: string, body: unknown, token?: string) => fetch(`${base}${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });

  test('missing or blank JWT_SECRET prevents initialization', async () => {
    try {
      for (const value of ['', '   ']) {
        process.env.JWT_SECRET = value;
        await expect(NestFactory.create(HttpTestModule, { logger: false, abortOnError: false })).rejects.toThrow('JWT_SECRET is required');
      }
    } finally {
      process.env.JWT_SECRET = secret;
    }
  });

  test('register/login validation and protected order identity', async () => {
    expect((await post('/auth/register', { email: 'invalid', password: 'x' })).status).toBe(400);
    const register = await post('/auth/register', { email: ' HTTP@Example.COM ', password: 'secret123', role: 'ADMIN' });
    expect(register.status).toBe(201);
    const user = await register.json();
    expect(user).toEqual({ id: expect.any(String), email: 'http@example.com' });
    expect((await post('/auth/register', { email: 'http@example.com', password: 'secret123' })).status).toBe(409);
    expect((await post('/auth/login', { email: 'http@example.com', password: 'wrong' })).status).toBe(401);
    const login = await post('/auth/login', { email: 'HTTP@example.com', password: 'secret123' });
    expect(login.status).toBe(200);
    const session = await login.json();
    expect(session.user.role).toBe('CUSTOMER');
    expect(session.user).not.toHaveProperty('passwordHash');
    const body = { userId: 'attacker', items: [{ productId: 'p1', size: 'M', toppings: [], quantity: 1 }] };
    expect((await post('/orders', body)).status).toBe(401);
    expect((await post('/orders', body, 'invalid')).status).toBe(401);
    expect(create).not.toHaveBeenCalled();
    expect((await post('/orders', body, session.accessToken)).status).toBe(201);
    expect(create.mock.calls[0][0]).toBe(user.id);
  });
});
