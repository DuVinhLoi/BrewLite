import { Body, Controller, Headers, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../contracts/order.contract';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class PaymentController {
  constructor(private payments: PaymentService) {}

  @Post('payments')
  @UseGuards(JwtAuthGuard)
  async pay(@Body() dto: CreatePaymentDto, @Headers('idempotency-key') key: string, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const r = await this.payments.processPayment(req.user.id, dto, key);
    res.status(r.isCached ? 200 : 201);
    return r;
  }

  @Patch('orders/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @Req() req: any) {
    const actor = { id: req.user.id, role: req.user.role };
    if (dto.status === OrderStatus.CANCELLED) return this.payments.cancelOrderAs(actor, id);
    return this.payments.advanceOrder(actor, id, dto.status);
  }
}
