import { TxContext } from './transaction.contract';

export interface ProductDto {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  version: number; // Optimistic locking version
}

export interface IProductRepository {
  findById(id: string, tx?: TxContext): Promise<ProductDto | null>;
  findAvailable(tx?: TxContext): Promise<ProductDto[]>;
  deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number, tx?: TxContext): Promise<boolean>;
  restoreStock(id: string, quantity: number, tx?: TxContext): Promise<void>;
  save(product: ProductDto, tx?: TxContext): Promise<ProductDto>;
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}
