import { TxContext } from './transaction.contract';

export interface UserDto {
  id: string;
  email: string;
  loyaltyPoints: number;
  /** Băm bcrypt do Task 7 (auth) quản lý; các flow khác không được đụng tới. */
  passwordHash?: string;
}

export interface IUserRepository {
  findById(id: string, tx?: TxContext): Promise<UserDto | null>;
  findByEmail(email: string, tx?: TxContext): Promise<UserDto | null>;
  addLoyaltyPoints(id: string, points: number, tx?: TxContext): Promise<UserDto>;
  save(user: UserDto, tx?: TxContext): Promise<UserDto>;
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}
