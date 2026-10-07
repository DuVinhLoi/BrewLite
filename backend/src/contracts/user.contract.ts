export interface UserDto {
  id: string;
  email: string;
  loyaltyPoints: number;
}

export interface IUserRepository {
  findById(id: string): Promise<UserDto | null>;
  addLoyaltyPoints(id: string, points: number): Promise<UserDto>;
  save(user: UserDto): Promise<UserDto>;
}
