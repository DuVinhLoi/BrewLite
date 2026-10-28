import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthController } from '../auth/auth.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutController, HealthController, OptionsController } from './checkout.controller';
@Module({ controllers: [AuthController, CheckoutController, HealthController, OptionsController], providers: [AuthService, AuthGuard, CheckoutService] })
export class CheckoutModule {}