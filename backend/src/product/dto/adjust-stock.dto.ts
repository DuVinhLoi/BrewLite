import { IsIn, IsInt, Max, Min } from 'class-validator';

export class AdjustStockDto {
  // set: đặt số tuyệt đối; delta: cộng/trừ (âm = trừ)
  @IsIn(['set', 'delta'])
  mode!: 'set' | 'delta';

  // trong khoảng Int32 vì cột stock là Int ở Postgres (vượt sẽ 500)
  @IsInt()
  @Min(-2147483648)
  @Max(2147483647)
  value!: number;

  // version đang thấy trên màn hình (optimistic lock, cùng cơ chế §9 ý 3)
  @IsInt()
  @Min(1)
  version!: number;
}
