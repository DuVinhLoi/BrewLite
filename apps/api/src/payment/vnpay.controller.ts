import { Controller, Get, Query } from '@nestjs/common';
import { CheckoutService } from '../checkout/checkout.service';

// Public on purpose (no AuthGuard): VNPay calls the IPN itself and the browser lands on return before any login check.
// Both are protected by the VNPay signature instead.
@Controller('payments/vnpay')
export class VnpayController {
  constructor(private readonly checkout: CheckoutService) {}
  @Get('ipn') ipn(@Query() query: Record<string, unknown>) { return this.checkout.ipn(query); }
  @Get('return') checkReturn(@Query() query: Record<string, unknown>) { return this.checkout.checkReturn(query); }
}
