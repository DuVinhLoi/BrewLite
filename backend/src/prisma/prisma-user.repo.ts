import { Injectable } from '@nestjs/common';
import type { User as UserRow } from '@prisma/client';
import { IUserRepository, Role, toRole, UserDto } from '../contracts/user.contract';
import { TxContext } from '../contracts/transaction.contract';
import { PrismaService } from './prisma.service';

function toUserDto(u: UserRow): UserDto {
  return { id: u.id, email: u.email, loyaltyPoints: u.loyaltyPoints, passwordHash: u.passwordHash, role: toRole(u.role) };
}

@Injectable()
export class PrismaUserRepo implements IUserRepository {
  constructor(private db: PrismaService) {}

  private cx(tx?: TxContext): PrismaService {
    return (tx as PrismaService) ?? this.db;
  }

  async findById(id: string, tx?: TxContext): Promise<UserDto | null> {
    const u = await this.cx(tx).user.findUnique({ where: { id } });
    return u && toUserDto(u);
  }

  async findByEmail(email: string, tx?: TxContext): Promise<UserDto | null> {
    const u = await this.cx(tx).user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    return u && toUserDto(u);
  }

  async addLoyaltyPoints(id: string, points: number, tx?: TxContext): Promise<UserDto> {
    const u = await this.cx(tx).user.update({ where: { id }, data: { loyaltyPoints: { increment: points } } });
    return toUserDto(u);
  }

  async save(user: UserDto, tx?: TxContext): Promise<UserDto> {
    // Nhánh update không đụng passwordHash (của Task 7); nhánh create truyền đúng hash nhận được
    const u = await this.cx(tx).user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, passwordHash: user.passwordHash ?? '', loyaltyPoints: user.loyaltyPoints, role: user.role ?? Role.CUSTOMER },
      update: { email: user.email, loyaltyPoints: user.loyaltyPoints, ...(user.role ? { role: user.role } : {}) },
    });
    return toUserDto(u);
  }
}
