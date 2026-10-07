import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId!: string;

  @IsIn(['WALLET', 'CARD'])
  paymentMethod!: 'WALLET' | 'CARD';

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
