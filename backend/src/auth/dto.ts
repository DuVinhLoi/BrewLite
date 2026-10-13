import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizeEmail(value) : value)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizeEmail(value) : value)
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
