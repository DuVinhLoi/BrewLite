import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { AuthModule } from '../auth/auth.module';
import { IOrderRepository } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { IPaymentRepository } from '../contracts/payment.contract';
import { IUserRepository } from '../contracts/user.contract';
import { InMemoryOrderRepo } from '../stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../stubs/in-memory-product.repo';
import { InMemoryPaymentRepo } from '../stubs/in-memory-payment.repo';
import { InMemoryUserRepo } from '../stubs/in-memory-user.repo';
import { PrismaOrderRepo } from '../prisma/prisma-order.repo';
import { PrismaProductRepo } from '../prisma/prisma-product.repo';
import { PrismaPaymentRepo } from '../prisma/prisma-payment.repo';
import { PrismaUserRepo } from '../prisma/prisma-user.repo';

// Có DATABASE_URL thì cắm Prisma (Postgres thật); không có thì InMemory, chỉ để jest (main.ts bắt buộc DATABASE_URL khi chạy)
const useDb = !!process.env.DATABASE_URL;
const OrderRepo = useDb ? PrismaOrderRepo : InMemoryOrderRepo;
const ProductRepo = useDb ? PrismaProductRepo : InMemoryProductRepo;
const PaymentRepo = useDb ? PrismaPaymentRepo : InMemoryPaymentRepo;
const UserRepo = useDb ? PrismaUserRepo : InMemoryUserRepo;

@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
  providers: [
    {
      provide: PaymentService,
      useFactory: (
        o: IOrderRepository,
        p: IProductRepository,
        pay: IPaymentRepository,
        u: IUserRepository,
        g: MockPaymentGatewayService,
      ) => new PaymentService(o, p, pay, u, g),
      inject: [OrderRepo, ProductRepo, PaymentRepo, UserRepo, MockPaymentGatewayService],
    },
    MockPaymentGatewayService,
    ...(useDb ? [PrismaOrderRepo, PrismaProductRepo, PrismaPaymentRepo, PrismaUserRepo] : [InMemoryOrderRepo, InMemoryProductRepo, InMemoryPaymentRepo, InMemoryUserRepo]),
  ],
})
export class PaymentModule {}
