import { Logger, Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthController } from '../auth/auth.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutController, HealthController, OptionsController } from './checkout.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { VnpayController } from '../payment/vnpay.controller';
import { VnpayGateway } from '../payment/payment-gateway';
import { assertPaymentProvider, missingVnpayVars, readVnpayConfig } from '../payment/vnpay-config';
@Module({ imports: [InventoryModule], controllers: [AuthController, CheckoutController, VnpayController, HealthController, OptionsController], providers: [AuthService, AuthGuard, CheckoutService, VnpayGateway] })
export class CheckoutModule {
  // Startup check (plan 1.8): an unsupported provider stops the API; missing VNPay variables only print their names.
  constructor() {
    assertPaymentProvider();
    const missing = missingVnpayVars(readVnpayConfig());
    if (missing.length) new Logger('VnpayConfig').warn(`VNPay configuration incomplete: missing ${missing.join(', ')}`);
  }
}
