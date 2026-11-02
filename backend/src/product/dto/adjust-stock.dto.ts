import { IsIn, IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  // set: đặt số tuyệt đối; delta: cộng/trừ (âm = trừ)
  @ApiProperty({ enum: ['set', 'delta'], example: 'set' })
  @IsIn(['set', 'delta'])
  mode!: 'set' | 'delta';

  // trong khoảng Int32 vì cột stock là Int ở Postgres (vượt sẽ 500)
  @ApiProperty({ type: 'integer', minimum: -2147483648, maximum: 2147483647, example: 20 })
  @IsInt()
  @Min(-2147483648)
  @Max(2147483647)
  value!: number;

  // version đang thấy trên màn hình (optimistic lock, cùng cơ chế §9 ý 3)
  @ApiProperty({ type: 'integer', minimum: 1, example: 1, description: 'version lấy từ GET /admin/products' })
  @IsInt()
  @Min(1)
  version!: number;
}
