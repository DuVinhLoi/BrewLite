import { Injectable } from '@nestjs/common';
import { IUserRepository, UserDto } from '../contracts/user.contract';
import { TxContext } from '../contracts/transaction.contract';
import { registerInMemoryRepo, snapshotMap } from './in-memory-tx';

// Lưu và trả bản sao (như Prisma trả hàng mới mỗi lần đọc)
@Injectable()
export class InMemoryUserRepo implements IUserRepository {
  private store = new Map<string, UserDto>();

  constructor() {
    registerInMemoryRepo({
      snap: () => snapshotMap(this.store),
      restore: (s) => {
        this.store.clear();
        for (const [k, v] of s) this.store.set(k as string, v as UserDto);
      },
    });
  }

  async findById(id: string, _tx?: TxContext): Promise<UserDto | null> {
    const u = this.store.get(id);
    return u ? structuredClone(u) : null;
  }

  async findByEmail(email: string, _tx?: TxContext): Promise<UserDto | null> {
    for (const u of this.store.values()) if (u.email === email) return structuredClone(u);
    return null;
  }

  async addLoyaltyPoints(id: string, points: number, _tx?: TxContext): Promise<UserDto> {
    const u = this.store.get(id);
    if (!u) throw new Error('User not found');
    u.loyaltyPoints += points;
    return structuredClone(u);
  }

  async save(user: UserDto, _tx?: TxContext): Promise<UserDto> {
    this.store.set(user.id, structuredClone(user));
    return structuredClone(user);
  }
}
