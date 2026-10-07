import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { IProductRepository } from '../contracts/product.contract';
import { InMemoryProductRepo } from '../stubs/in-memory-product.repo';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaProductRepo } from '../prisma/prisma-product.repo';

const useDb = !!process.env.DATABASE_URL;
const ProductRepo = useDb ? PrismaProductRepo : InMemoryProductRepo;

@Module({
  controllers: [ProductController],
  providers: [
    {
      provide: ProductService,
      useFactory: (p: IProductRepository) => new ProductService(p),
      inject: [ProductRepo],
    },
    ...(useDb ? [PrismaService, PrismaProductRepo] : [InMemoryProductRepo]),
  ],
})
export class ProductModule {}
