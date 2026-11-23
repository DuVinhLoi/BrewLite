import { Controller, Get, Param } from '@nestjs/common';
import { Product } from '@prisma/client';
import { CatalogService } from './catalog.service';

@Controller('products')
export class CatalogController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly catalogService: CatalogService) {}

  /** Tiếp nhận yêu cầu HTTP và trả danh sách sản phẩm từ CatalogService. */
  @Get()
  findAll(): Promise<Product[]> {
    return this.catalogService.findAll();
  }

  /** Tiếp nhận yêu cầu HTTP và trả chi tiết sản phẩm theo mã. */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.catalogService.findOne(id);
  }
}
