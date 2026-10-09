import { IsIn, IsInt, Min } from 'class-validator';

export class AdjustStockDto {
  // set: đặt số tuyệt đối; delta: cộng/trừ (âm = trừ)
  @IsIn(['set', 'delta'])
  mode!: 'set' | 'delta';

  @IsInt()
  value!: number;

  // version đang thấy trên màn hình (optimistic lock, cùng cơ chế §9 ý 3)
  @IsInt()
  @Min(1)
  version!: number;
}
