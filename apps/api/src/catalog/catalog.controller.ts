import { Controller, Get, Param } from '@nestjs/common';
import { Product } from '@prisma/client';
import { CatalogService } from './catalog.service';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.catalogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.catalogService.findOne(id);
  }
}
