export interface ProductDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  version: number; // Optimistic locking version
}

export interface IProductRepository {
  findById(id: string): Promise<ProductDto | null>;
  deductStockWithOptimisticLock(id: string, quantity: number, currentVersion: number): Promise<boolean>;
  restoreStock(id: string, quantity: number): Promise<void>;
  save(product: ProductDto): Promise<ProductDto>;
}
