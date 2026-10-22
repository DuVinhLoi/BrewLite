import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizeEmail(value) : value)
  @ApiProperty({ example: 'new@brewlite.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? normalizeEmail(value) : value)
  @ApiProperty({ example: 'demo@brewlite.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  password!: string;
}
