import { Controller, Get, Param } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private products: ProductService) {}

  @Get()
  list() {
    return this.products.listAvailable();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.products.getById(id);
  }
}
