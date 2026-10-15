import { IsArray, IsIn, IsInt, IsOptional, IsString, ArrayMaxSize, ArrayMinSize, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SIZES, Size } from '../pricing';

export class OrderItemInput {
  @ApiProperty({ example: 'p1' })
  @IsString()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: 99, example: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  // Không nhận unitPrice từ client: server tự tính từ product.price + size/topping (order/pricing.ts)
  @ApiPropertyOptional({ enum: SIZES })
  @IsOptional()
  @IsIn(SIZES)
  size?: Size;

  @ApiPropertyOptional({ type: [String], example: ['Trân châu'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];
}

export class CreateOrderDto {
  @ApiProperty({ type: () => [OrderItemInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];
}
