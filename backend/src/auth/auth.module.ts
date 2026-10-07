import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IUserRepository } from '../contracts/user.contract';
import { InMemoryUserRepo } from '../stubs/in-memory-user.repo';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaUserRepo } from '../prisma/prisma-user.repo';

const useDb = !!process.env.DATABASE_URL;
const UserRepo = useDb ? PrismaUserRepo : InMemoryUserRepo;

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'brewlite-dev-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AuthService,
      useFactory: (u: IUserRepository, jwt: JwtService) => new AuthService(u, jwt),
      inject: [UserRepo, JwtService],
    },
    JwtAuthGuard,
    ...(useDb ? [PrismaService, PrismaUserRepo] : [InMemoryUserRepo]),
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}

export { JwtAuthGuard } from './jwt-auth.guard';
export { CurrentUser } from './current-user.decorator';
