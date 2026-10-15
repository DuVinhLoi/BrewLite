import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'id đơn trả về từ POST /orders' })
  @IsString()
  orderId!: string;

  @ApiProperty({ enum: ['WALLET', 'CARD'] })
  @IsIn(['WALLET', 'CARD'])
  paymentMethod!: 'WALLET' | 'CARD';

  @ApiPropertyOptional({ example: 'BREWLITE10' })
  @IsOptional()
  @IsString()
  voucherCode?: string;
}
