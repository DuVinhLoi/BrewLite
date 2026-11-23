import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** Kết nối Prisma với cơ sở dữ liệu khi module được khởi tạo. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Đóng kết nối Prisma khi ứng dụng dừng để giải phóng tài nguyên. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
