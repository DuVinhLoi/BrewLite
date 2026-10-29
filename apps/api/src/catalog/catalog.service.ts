import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService, private readonly inventory: InventoryService) {}

  findAll(): Promise<Product[]> {
    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ orderBy: { name: 'asc' } });
      const { response } = await this.inventory.evaluate(tx, products.map((p) => ({ productId: p.id, size: 'S', toppings: [], quantity: 1 })));
      return products.map((p, index) => ({ ...p, stock: response.lines[index].cups }));
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async findOne(id: string): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });

      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Không tìm thấy sản phẩm',
        });
      }

      const { response } = await this.inventory.evaluate(tx, [{ productId: id, size: 'S', toppings: [], quantity: 1 }]);
      return { ...product, stock: response.lines[0].cups };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }
}
