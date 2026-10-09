import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../contracts/user.contract';

// UC14 (mở rộng ngoài MVP §3.2): kiểm / điều chỉnh tồn kho, chỉ ADMIN
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductController {
  constructor(private products: ProductService) {}

  @Get()
  list() {
    return this.products.listAll();
  }

  @Patch(':id/stock')
  adjust(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.products.adjustStock(id, dto);
  }
}
