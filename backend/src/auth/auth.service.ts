import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { IUserRepository, Role } from '../contracts/user.contract';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private users: IUserRepository,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save({
      id: randomUUID(),
      email: dto.email,
      passwordHash: hash,
      loyaltyPoints: 0,
      role: Role.CUSTOMER, // đăng ký công khai không bao giờ tạo nhân viên
    });
    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash ?? ''))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const role = user.role ?? Role.CUSTOMER;
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role });
    return { accessToken, user: { id: user.id, email: user.email, role } };
  }
}
