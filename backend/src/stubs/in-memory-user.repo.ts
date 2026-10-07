import { Injectable } from '@nestjs/common';
import { IUserRepository, UserDto } from '../contracts/user.contract';

@Injectable()
export class InMemoryUserRepo implements IUserRepository {
  private store = new Map<string, UserDto>();

  async findById(id: string): Promise<UserDto | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    for (const u of this.store.values()) if (u.email === email) return u;
    return null;
  }

  async addLoyaltyPoints(id: string, points: number): Promise<UserDto> {
    const u = this.store.get(id);
    if (!u) throw new Error('User not found');
    u.loyaltyPoints += points;
    return u;
  }

  async save(user: UserDto): Promise<UserDto> {
    this.store.set(user.id, user);
    return user;
  }
}
