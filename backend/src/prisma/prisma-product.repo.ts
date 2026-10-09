import { Injectable } from '@nestjs/common';
import type { Product as ProductRow } from '@prisma/client';
import { IProductRepository, ProductDto } from '../contracts/product.contract';
import { TxContext } from '../contracts/transaction.contract';
import { PrismaService } from './prisma.service';

function toProductDto(p: ProductRow): ProductDto {
  return { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl ?? undefined, stock: p.stock, version: p.version };
}

@Injectable()
export class PrismaProductRepo implements IProductRepository {
  constructor(private db: PrismaService) {}

  private cx(tx?: TxContext): PrismaService {
    return (tx as PrismaService) ?? this.db;
  }

  async findById(id: string, tx?: TxContext): Promise<ProductDto | null> {
    const p = await this.cx(tx).product.findUnique({ where: { id } });
    return p && toProductDto(p);
  }

  async findAvailable(tx?: TxContext): Promise<ProductDto[]> {
    const list = await this.cx(tx).product.findMany({ where: { stock: { gt: 0 } } });
    return list.map(toProductDto);
  }

  async findAll(tx?: TxContext): Promise<ProductDto[]> {
    const list = await this.cx(tx).product.findMany({ orderBy: { name: 'asc' } });
    return list.map(toProductDto);
  }

  async setStockWithOptimisticLock(id: string, stock: number, currentVersion: number, tx?: TxContext): Promise<boolean> {
    const r = await this.cx(tx).product.updateMany({ where: { id, version: currentVersion }, data: { stock, version: { increment: 1 } } });
    return r.count === 1;
  }

  async deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number, tx?: TxContext): Promise<boolean> {
    const r = await this.cx(tx).product.updateMany({
      where: { id, version: currentVersion, stock: { gte: quantity } },
      data: { stock: { decrement: quantity }, version: { increment: 1 } },
    });
    return r.count === 1;
  }

  async restoreStock(id: string, quantity: number, tx?: TxContext): Promise<void> {
    // Hoàn kho cũng tăng version: mọi đột biến stock đều đổi phiên bản, khóa cũ đang giữ sẽ rớt (UC 2.4)
    await this.cx(tx).product.update({ where: { id }, data: { stock: { increment: quantity }, version: { increment: 1 } } });
  }

  async save(product: ProductDto, tx?: TxContext): Promise<ProductDto> {
    const p = await this.cx(tx).product.upsert({
      where: { id: product.id },
      create: { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, stock: product.stock, version: product.version },
      update: { name: product.name, price: product.price, imageUrl: product.imageUrl, stock: product.stock, version: product.version },
    });
    return toProductDto(p);
  }
}
