import { Injectable, NotFoundException } from '@nestjs/common';
import { IProductRepository } from '../contracts/product.contract';

@Injectable()
export class ProductService {
  constructor(private products: IProductRepository) {}

  listAvailable() {
    return this.products.findAvailable();
  }

  async getById(id: string) {
    const p = await this.products.findById(id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }
}
