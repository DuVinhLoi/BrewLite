import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { IUserRepository } from '../contracts/user.contract';
import { InMemoryUserRepo } from '../stubs/in-memory-user.repo';
import { PrismaUserRepo } from '../prisma/prisma-user.repo';

const useDb = !!process.env.DATABASE_URL;
const UserRepo = useDb ? PrismaUserRepo : InMemoryUserRepo;

@Module({
  imports: [
    JwtModule.register({
      // ponytail: khóa mặc định công khai (ai biết khóa tự ký được token ADMIN) — chỉ cho demo cục bộ, xem README "Lưu ý bảo mật"; chạy thật thì bắt buộc đặt JWT_SECRET riêng
      secret: process.env.JWT_SECRET ?? 'brewlite-dev-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    {
      provide: AuthService,
      useFactory: (u: IUserRepository, jwt: JwtService) => new AuthService(u, jwt),
      inject: [UserRepo, JwtService],
    },
    JwtAuthGuard,
    RolesGuard,
    ...(useDb ? [PrismaUserRepo] : [InMemoryUserRepo]),
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

export { JwtAuthGuard } from './jwt-auth.guard';
export { RolesGuard } from './roles.guard';
export { Roles } from './roles.decorator';
