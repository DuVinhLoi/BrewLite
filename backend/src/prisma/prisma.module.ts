import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Một PrismaService (một pool kết nối) dùng chung cho mọi repo Prisma. Không có DATABASE_URL (chỉ jest) thì module rỗng.
const useDb = !!process.env.DATABASE_URL;

@Global()
@Module({ providers: useDb ? [PrismaService] : [], exports: useDb ? [PrismaService] : [] })
export class PrismaModule {}
