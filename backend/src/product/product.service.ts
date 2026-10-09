import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { IProductRepository } from '../contracts/product.contract';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class ProductService {
  constructor(private products: IProductRepository) {}

  listAvailable() {
    return this.products.findAvailable();
  }

  // UC14 (mở rộng §3.2): admin xem mọi món, kể cả hết hàng
  listAll() {
    return this.products.findAll();
  }

  async getById(id: string) {
    const p = await this.products.findById(id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  // UC14: chỉnh tồn kho theo version đang thấy; ai bán/sửa trước thì 409 để admin tải lại
  async adjustStock(id: string, dto: AdjustStockDto) {
    const p = await this.getById(id);
    if (p.version !== dto.version) throw new ConflictException('Stock changed, reload');
    const next = dto.mode === 'set' ? dto.value : p.stock + dto.value;
    if (next < 0) throw new BadRequestException('Stock cannot be negative');
    if (!(await this.products.setStockWithOptimisticLock(id, next, dto.version))) throw new ConflictException('Stock changed, reload');
    return this.getById(id);
  }
}
