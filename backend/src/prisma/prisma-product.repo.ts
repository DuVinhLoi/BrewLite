import { Injectable } from '@nestjs/common';
import { IProductRepository, ProductDto } from '../contracts/product.contract';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaProductRepo implements IProductRepository {
  constructor(private db: PrismaService) {}

  async findById(id: string): Promise<ProductDto | null> {
    const p = await this.db.product.findUnique({ where: { id } });
    if (!p) return null;
    return { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl ?? undefined, stock: p.stock, version: p.version };
  }

  async findAvailable(): Promise<ProductDto[]> {
    const list = await this.db.product.findMany({ where: { stock: { gt: 0 } } });
    return list.map((p) => ({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl ?? undefined, stock: p.stock, version: p.version }));
  }

  async deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number): Promise<boolean> {
    const r = await this.db.product.updateMany({
      where: { id, version: currentVersion, stock: { gte: quantity } },
      data: { stock: { decrement: quantity }, version: { increment: 1 } },
    });
    return r.count === 1;
  }

  async restoreStock(id: string, quantity: number): Promise<void> {
    // Hoàn kho cũng tăng version: mọi đột biến stock đều đổi phiên bản, khóa cũ đang giữ sẽ rớt (UC 2.4)
    await this.db.product.update({ where: { id }, data: { stock: { increment: quantity }, version: { increment: 1 } } });
  }

  async save(product: ProductDto): Promise<ProductDto> {
    const p = await this.db.product.upsert({
      where: { id: product.id },
      create: { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, stock: product.stock, version: product.version },
      update: { name: product.name, price: product.price, imageUrl: product.imageUrl, stock: product.stock, version: product.version },
    });
    return { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl ?? undefined, stock: p.stock, version: p.version };
  }
}
