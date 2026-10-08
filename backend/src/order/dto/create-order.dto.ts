import { IsArray, IsIn, IsInt, IsOptional, IsString, ArrayMinSize, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SIZES, Size } from '../pricing';

export class OrderItemInput {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  // Không nhận unitPrice từ client: server tự tính từ product.price + size/topping (order/pricing.ts)
  @IsOptional()
  @IsIn(SIZES)
  size?: Size;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];
}
