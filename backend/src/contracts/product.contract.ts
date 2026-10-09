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
  /** UC14: mọi món, kể cả hết hàng, sắp theo tên. */
  findAll(tx?: TxContext): Promise<ProductDto[]>;
  /** UC14: đặt tồn kho tuyệt đối nếu version khớp; tăng version. false = có người đổi trước. */
  setStockWithOptimisticLock(id: string, stock: number, currentVersion: number, tx?: TxContext): Promise<boolean>;
  deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number, tx?: TxContext): Promise<boolean>;
  restoreStock(id: string, quantity: number, tx?: TxContext): Promise<void>;
  save(product: ProductDto, tx?: TxContext): Promise<ProductDto>;
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}
