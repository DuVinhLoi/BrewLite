import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { IUserRepository, Role, toRole, UserDto } from '../contracts/user.contract';
import { LoginDto, RegisterDto, normalizeEmail } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private users: IUserRepository,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(dto.password, 10);
    let user: UserDto;
    try {
      user = await this.users.save({
        id: randomUUID(),
        email,
        passwordHash: hash,
        loyaltyPoints: 0,
        role: Role.CUSTOMER, // đăng ký công khai không bao giờ tạo nhân viên
      });
    } catch (error) {
      const failure = error as { code?: unknown; meta?: { target?: unknown } } | null;
      const target = failure?.meta?.target;
      if (failure?.code === 'P2002' && Array.isArray(target) && target.includes('email')) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(normalizeEmail(dto.email));
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash ?? ''))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const role = toRole(user.role);
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role });
    return { accessToken, user: { id: user.id, email: user.email, role } };
  }

  /** Hồ sơ của chính người gọi: không trả passwordHash. Token còn hạn nhưng user đã bị xoá → 404. */
  async profile(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, role: toRole(user.role), loyaltyPoints: user.loyaltyPoints };
  }
}
