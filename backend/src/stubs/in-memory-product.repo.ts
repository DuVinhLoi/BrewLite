import { Injectable } from '@nestjs/common';
import { IProductRepository, ProductDto } from '../contracts/product.contract';

@Injectable()
export class InMemoryProductRepo implements IProductRepository {
  private store = new Map<string, ProductDto>();

  async findById(id: string): Promise<ProductDto | null> {
    return this.store.get(id) ?? null;
  }

  async findAvailable(): Promise<ProductDto[]> {
    return [...this.store.values()].filter((p) => p.stock > 0);
  }

  async deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number): Promise<boolean> {
    const p = this.store.get(id);
    if (!p || p.version !== currentVersion || p.stock < quantity) return false;
    p.stock -= quantity;
    p.version += 1;
    return true;
  }

  async restoreStock(id: string, quantity: number): Promise<void> {
    const p = this.store.get(id);
    if (p) {
      p.stock += quantity;
      p.version += 1;
    }
  }

  async save(product: ProductDto): Promise<ProductDto> {
    this.store.set(product.id, product);
    return product;
  }
}
