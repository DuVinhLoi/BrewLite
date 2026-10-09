import { TxContext } from './transaction.contract';

export enum Role {
  CUSTOMER = 'CUSTOMER',
  BARISTA = 'BARISTA',
  ADMIN = 'ADMIN',
}

/** Người đang gọi API (lấy từ JWT): dùng cho luật theo vai trò ở service. */
export type Actor = { id: string; role: Role };

/** Danh sách dương: chỉ BARISTA/ADMIN là staff; vai trò lạ hoặc thiếu coi như khách (không fail-open). */
export const isStaff = (actor: { role?: unknown }): boolean => actor.role === Role.BARISTA || actor.role === Role.ADMIN;

/** Cột role ở DB là TEXT tự do: chỉ nhận giá trị thuộc enum Role, còn lại về CUSTOMER. */
export const toRole = (value: unknown): Role =>
  value === Role.BARISTA || value === Role.ADMIN ? value : Role.CUSTOMER;

export interface UserDto {
  id: string;
  email: string;
  loyaltyPoints: number;
  /** Băm bcrypt do Task 7 (auth) quản lý; các flow khác không được đụng tới. */
  passwordHash?: string;
  /** Mở rộng ngoài đề (§3.2): vai trò quầy/quản trị. Thiếu = CUSTOMER. */
  role?: Role;
}

export interface IUserRepository {
  findById(id: string, tx?: TxContext): Promise<UserDto | null>;
  findByEmail(email: string, tx?: TxContext): Promise<UserDto | null>;
  addLoyaltyPoints(id: string, points: number, tx?: TxContext): Promise<UserDto>;
  save(user: UserDto, tx?: TxContext): Promise<UserDto>;
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}
