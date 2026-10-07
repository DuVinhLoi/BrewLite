export interface UserDto {
  id: string;
  email: string;
  loyaltyPoints: number;
  /** Băm bcrypt do Task 7 (auth) quản lý; các flow khác không được đụng tới. */
  passwordHash?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserDto | null>;
  findByEmail(email: string): Promise<UserDto | null>;
  addLoyaltyPoints(id: string, points: number): Promise<UserDto>;
  save(user: UserDto): Promise<UserDto>;
}
