import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId!: string;

  @IsIn(['WALLET', 'CARD'])
  paymentMethod!: 'WALLET' | 'CARD';

  @IsOptional()
  @IsString()
  voucherCode?: string;

  // stub-only test hook, remove when real gateway lands
  @IsOptional()
  @IsBoolean()
  shouldSimulateFailure?: boolean;
}
