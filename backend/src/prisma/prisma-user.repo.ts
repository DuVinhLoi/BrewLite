import { Injectable } from '@nestjs/common';
import { IUserRepository, UserDto } from '../contracts/user.contract';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepo implements IUserRepository {
  constructor(private db: PrismaService) {}

  async findById(id: string): Promise<UserDto | null> {
    const u = await this.db.user.findUnique({ where: { id } });
    if (!u) return null;
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, passwordHash: u.passwordHash };
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const u = await this.db.user.findUnique({ where: { email } });
    if (!u) return null;
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, passwordHash: u.passwordHash };
  }

  async addLoyaltyPoints(id: string, points: number): Promise<UserDto> {
    const u = await this.db.user.update({ where: { id }, data: { loyaltyPoints: { increment: points } } });
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints };
  }

  async save(user: UserDto): Promise<UserDto> {
    // Nhánh update không đụng passwordHash (của Task 7); nhánh create truyền đúng hash nhận được
    const u = await this.db.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, passwordHash: user.passwordHash ?? '', loyaltyPoints: user.loyaltyPoints },
      update: { email: user.email, loyaltyPoints: user.loyaltyPoints },
    });
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints };
  }
}
