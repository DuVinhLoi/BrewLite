import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { invalid, record } from '../checkout/pricing';
export type Identity = { sub: string; role: 'CUSTOMER' | 'BARISTA' };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  private secret(): string {
    const value = process.env.JWT_SECRET;
    if (!value || value.length < 32) throw new Error('JWT_SECRET phải có ít nhất 32 ký tự');
    return value;
  }
  token(identity: Identity): string {
    return sign({ role: identity.role }, this.secret(), { algorithm: 'HS256', subject: identity.sub, expiresIn: '1h', issuer: 'brewlite', audience: 'brewlite-api' });
  }
  authenticate(header?: string): Identity {
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const data = verify(header.slice(7), this.secret(), { algorithms: ['HS256'], issuer: 'brewlite', audience: 'brewlite-api' });
      if (typeof data === 'string' || !data.sub || !data.exp || !['CUSTOMER', 'BARISTA'].includes(data.role as string)) throw new Error();
      return { sub: data.sub, role: data.role as Identity['role'] };
    } catch { throw new UnauthorizedException(); }
  }
  private credentials(body: unknown, registration: boolean) {
    const input = record(body, ['email', 'password']);
    if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) invalid('email không hợp lệ');
    if (typeof input.password !== 'string' || !input.password || Buffer.byteLength(input.password) > 72) invalid('password phải có từ 1 đến 72 byte');
    if (registration && (input.password.length < 8 || !/[A-Za-z]/.test(input.password) || !/\d/.test(input.password))) invalid('password phải có ít nhất 8 ký tự gồm chữ và số');
    return { email: input.email.trim().toLowerCase(), password: input.password };
  }
  async register(body: unknown) {
    const { email, password } = this.credentials(body, true);
    try {
      return await this.prisma.user.create({ data: { email, passwordHash: await hash(password, 12) }, select: { id: true, email: true, role: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email đã được sử dụng' });
      throw error;
    }
  }
  async login(body: unknown) {
    const { email, password } = this.credentials(body, false);
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Equal bcrypt work for unknown emails prevents an obvious account timing oracle.
    const valid = await compare(password, user?.passwordHash ?? '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5h4d.jF5NjA7kdKFm0m5rMr1X1.IW8e');
    if (!user || !valid) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return { accessToken: this.token({ sub: user.id, role: user.role }), user: { id: user.id, email: user.email, role: user.role } };
  }
}