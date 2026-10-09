import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { AuthModule } from '../auth/auth.module';
import { IOrderRepository } from '../contracts/order.contract';
import { IProductRepository } from '../contracts/product.contract';
import { InMemoryOrderRepo } from '../stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../stubs/in-memory-product.repo';
import { PrismaOrderRepo } from '../prisma/prisma-order.repo';
import { PrismaProductRepo } from '../prisma/prisma-product.repo';

const useDb = !!process.env.DATABASE_URL;
const OrderRepo = useDb ? PrismaOrderRepo : InMemoryOrderRepo;
const ProductRepo = useDb ? PrismaProductRepo : InMemoryProductRepo;

@Module({
  imports: [AuthModule],
  controllers: [OrderController],
  providers: [
    {
      provide: OrderService,
      useFactory: (o: IOrderRepository, p: IProductRepository) => new OrderService(o, p),
      inject: [OrderRepo, ProductRepo],
    },
    ...(useDb ? [PrismaOrderRepo, PrismaProductRepo] : [InMemoryOrderRepo, InMemoryProductRepo]),
  ],
})
export class OrderModule {}
