import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { AdminProductController } from './admin-product.controller';
import { AuthModule } from '../auth/auth.module';
import { ProductService } from './product.service';
import { IProductRepository } from '../contracts/product.contract';
import { InMemoryProductRepo } from '../stubs/in-memory-product.repo';
import { PrismaProductRepo } from '../prisma/prisma-product.repo';

const useDb = !!process.env.DATABASE_URL;
const ProductRepo = useDb ? PrismaProductRepo : InMemoryProductRepo;

@Module({
  imports: [AuthModule],
  controllers: [ProductController, AdminProductController],
  providers: [
    {
      provide: ProductService,
      useFactory: (p: IProductRepository) => new ProductService(p),
      inject: [ProductRepo],
    },
    ...(useDb ? [PrismaProductRepo] : [InMemoryProductRepo]),
  ],
})
export class ProductModule {}
