import { Injectable } from '@nestjs/common';
import { IUserRepository, Role, UserDto } from '../contracts/user.contract';
import { TxContext } from '../contracts/transaction.contract';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepo implements IUserRepository {
  constructor(private db: PrismaService) {}

  private cx(tx?: TxContext): PrismaService {
    return (tx as PrismaService) ?? this.db;
  }

  async findById(id: string, tx?: TxContext): Promise<UserDto | null> {
    const u = await this.cx(tx).user.findUnique({ where: { id } });
    if (!u) return null;
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, passwordHash: u.passwordHash, role: u.role as Role };
  }

  async findByEmail(email: string, tx?: TxContext): Promise<UserDto | null> {
    const u = await this.cx(tx).user.findUnique({ where: { email } });
    if (!u) return null;
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, passwordHash: u.passwordHash, role: u.role as Role };
  }

  async addLoyaltyPoints(id: string, points: number, tx?: TxContext): Promise<UserDto> {
    const u = await this.cx(tx).user.update({ where: { id }, data: { loyaltyPoints: { increment: points } } });
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, role: u.role as Role };
  }

  async save(user: UserDto, tx?: TxContext): Promise<UserDto> {
    // Nhánh update không đụng passwordHash (của Task 7); nhánh create truyền đúng hash nhận được
    const u = await this.cx(tx).user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, passwordHash: user.passwordHash ?? '', loyaltyPoints: user.loyaltyPoints, role: user.role ?? Role.CUSTOMER },
      update: { email: user.email, loyaltyPoints: user.loyaltyPoints, ...(user.role ? { role: user.role } : {}) },
    });
    return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, role: u.role as Role };
  }

  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return this.db.$transaction((tx) => fn(tx));
  }
}
