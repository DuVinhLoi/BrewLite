import { Body, Controller, Get, Headers, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthRequest } from '../auth/auth.guard';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../prisma/prisma.service';
import { sizes, toppings } from './pricing';
@Controller()
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}
  @Post('orders') create(@Req() request: AuthRequest, @Body() body: unknown) { return this.checkout.create(request.user, body); }
  @Get('orders/me') list(@Req() request: AuthRequest) { return this.checkout.list(request.user); }
  @Get('orders/:id') detail(@Req() request: AuthRequest, @Param('id') id: string) { return this.checkout.detail(request.user, id); }
  @Patch('orders/:id') transition(@Req() request: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.checkout.transition(request.user, id, body); }
  @Post('payments') async pay(@Req() request: AuthRequest, @Body() body: unknown, @Headers('idempotency-key') key: string | undefined, @Res({ passthrough: true }) response: Response) {
    const result = await this.checkout.pay(request.user, body, key);
    response.status(result.replay ? 200 : 201);
    return result.body;
  }
}
@Controller('catalog/options')
export class OptionsController {
  @Get() options() { return { sizes, toppings }; }
}
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async health(@Res({ passthrough: true }) response: Response) {
    try { await this.prisma.$queryRaw`SELECT 1`; return { status: 'ok', database: 'up' }; }
    catch { response.status(503); return { status: 'error', database: 'down' }; }
  }
}