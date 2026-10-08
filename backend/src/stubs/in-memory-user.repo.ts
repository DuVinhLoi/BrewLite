import { Injectable } from '@nestjs/common';
import { IUserRepository, UserDto } from '../contracts/user.contract';
import { TxContext } from '../contracts/transaction.contract';
import { registerInMemoryRepo, runInMemoryTransaction, snapshotMap } from './in-memory-tx';

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
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string, _tx?: TxContext): Promise<UserDto | null> {
    for (const u of this.store.values()) if (u.email === email) return u;
    return null;
  }

  async addLoyaltyPoints(id: string, points: number, _tx?: TxContext): Promise<UserDto> {
    const u = this.store.get(id);
    if (!u) throw new Error('User not found');
    u.loyaltyPoints += points;
    return u;
  }

  async save(user: UserDto, _tx?: TxContext): Promise<UserDto> {
    this.store.set(user.id, user);
    return user;
  }

  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return runInMemoryTransaction(() => fn(undefined));
  }
}
