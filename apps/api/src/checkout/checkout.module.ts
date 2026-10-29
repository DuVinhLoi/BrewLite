import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthController } from '../auth/auth.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutController, HealthController, OptionsController } from './checkout.controller';
import { InventoryModule } from '../inventory/inventory.module';
@Module({ imports: [InventoryModule], controllers: [AuthController, CheckoutController, HealthController, OptionsController], providers: [AuthService, AuthGuard, CheckoutService] })
export class CheckoutModule {}
