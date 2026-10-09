import { Injectable } from '@nestjs/common';
import { IProductRepository, ProductDto } from '../contracts/product.contract';
import { TxContext } from '../contracts/transaction.contract';
import { registerInMemoryRepo, runInMemoryTransaction, snapshotMap } from './in-memory-tx';

@Injectable()
export class InMemoryProductRepo implements IProductRepository {
  private store = new Map<string, ProductDto>();

  constructor() {
    registerInMemoryRepo({
      snap: () => snapshotMap(this.store),
      restore: (s) => {
        this.store.clear();
        for (const [k, v] of s) this.store.set(k as string, v as ProductDto);
      },
    });
  }

  async findById(id: string, _tx?: TxContext): Promise<ProductDto | null> {
    return this.store.get(id) ?? null;
  }

  async findAvailable(_tx?: TxContext): Promise<ProductDto[]> {
    return [...this.store.values()].filter((p) => p.stock > 0);
  }

  async findAll(_tx?: TxContext): Promise<ProductDto[]> {
    return [...this.store.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async setStockWithOptimisticLock(id: string, stock: number, currentVersion: number, _tx?: TxContext): Promise<boolean> {
    const p = this.store.get(id);
    if (!p || p.version !== currentVersion) return false;
    p.stock = stock;
    p.version += 1;
    return true;
  }

  async deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number, _tx?: TxContext): Promise<boolean> {
    const p = this.store.get(id);
    if (!p || p.version !== currentVersion || p.stock < quantity) return false;
    p.stock -= quantity;
    p.version += 1;
    return true;
  }

  async restoreStock(id: string, quantity: number, _tx?: TxContext): Promise<void> {
    const p = this.store.get(id);
    if (p) {
      p.stock += quantity;
      p.version += 1;
    }
  }

  async save(product: ProductDto, _tx?: TxContext): Promise<ProductDto> {
    this.store.set(product.id, product);
    return product;
  }

  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return runInMemoryTransaction(() => fn(undefined));
  }
}
