import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { InMemoryUserRepo } from '../src/stubs/in-memory-user.repo';

function decodePayload(token: string) {
  const [, payload] = token.split('.');
  const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

describe('auth', () => {
  const jwt = new JwtService({ secret: 'brewlite-dev-secret', signOptions: { expiresIn: '7d' } });
  let repo: InMemoryUserRepo;
  let svc: AuthService;

  beforeEach(() => {
    repo = new InMemoryUserRepo();
    svc = new AuthService(repo, jwt);
  });

  it('register returns {id,email} without hash; stored hash verifies', async () => {
    const res = await svc.register({ email: 'a@b.co', password: 'secret1' });
    expect(res.id).toBeTruthy();
    expect(res.email).toBe('a@b.co');
    expect((res as any).passwordHash).toBeUndefined();
    const stored = await repo.findByEmail('a@b.co');
    expect(stored!.passwordHash).toBeTruthy();
    expect(await bcrypt.compare('secret1', stored!.passwordHash!)).toBe(true);
  });

  it('duplicate register → 409', async () => {
    await svc.register({ email: 'a@b.co', password: 'secret1' });
    await expect(svc.register({ email: 'a@b.co', password: 'secret1' })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('login wrong password AND unknown email → identical 401', async () => {
    await svc.register({ email: 'a@b.co', password: 'secret1' });
    const e1 = await svc.login({ email: 'a@b.co', password: 'wrongpw' }).catch((e) => e);
    const e2 = await svc.login({ email: 'no@such.co', password: 'wrongpw' }).catch((e) => e);
    expect(e1.status).toBe(401);
    expect(e2.status).toBe(401);
    expect(e1.message).toBe('Invalid credentials');
    expect(e2.message).toBe('Invalid credentials');
  });

  it('login ok → token payload {sub,email,role}', async () => {
    const reg = await svc.register({ email: 'a@b.co', password: 'secret1' });
    const res = await svc.login({ email: 'a@b.co', password: 'secret1' });
    expect(res.accessToken).toBeTruthy();
    expect(res.user).toEqual({ id: reg.id, email: 'a@b.co', role: 'CUSTOMER' });
    const payload = decodePayload(res.accessToken);
    expect(payload.sub).toBe(reg.id);
    expect(payload.email).toBe('a@b.co');
  });

  it('guard: valid Bearer → true and req.user set', async () => {
    const guard = new JwtAuthGuard(jwt);
    const token = jwt.sign({ sub: 'u1', email: 'a@b.co' });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const ctx: any = { switchToHttp: () => ({ getRequest: () => req }) };
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.co', role: 'CUSTOMER' });
  });

  it('guard: no header → 401, Bearer bad → 401', async () => {
    const guard = new JwtAuthGuard(jwt);
    const ctxNo = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as any;
    await expect(guard.canActivate(ctxNo)).rejects.toMatchObject({ status: 401 });
    const ctxBad = {
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: 'Bearer bad' } }) }),
    } as any;
    await expect(guard.canActivate(ctxBad)).rejects.toMatchObject({ status: 401 });
  });

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

  it('profile: trả {id,email,role,loyaltyPoints} đúng điểm hiện có, không lộ passwordHash', async () => {
    const reg = await svc.register({ email: 'p@b.co', password: 'secret1' });
    await repo.addLoyaltyPoints(reg.id, 42);
    const p = await svc.profile(reg.id);
    expect(p).toEqual({ id: reg.id, email: 'p@b.co', role: 'CUSTOMER', loyaltyPoints: 42 });
    expect((p as any).passwordHash).toBeUndefined();
  });

  it('profile: user không còn trong DB → 404', async () => {
    await expect(svc.profile('ghost')).rejects.toMatchObject({ status: 404 });
  });
});
