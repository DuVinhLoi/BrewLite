import { BadRequestException, Body, Controller, Headers, Param, Patch, Post, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../contracts/order.contract';

@Controller()
export class PaymentController {
  constructor(private payments: PaymentService) {}

  @Post('payments')
  async pay(@Body() dto: CreatePaymentDto, @Headers('idempotency-key') key: string, @Res({ passthrough: true }) res: any) {
    const r = await this.payments.processPayment(dto, key);
    res.status(r.isCached ? 200 : 201);
    return r;
  }

  @Patch('orders/:id')
  async cancel(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    if (dto.status !== OrderStatus.CANCELLED) throw new BadRequestException('Only CANCELLED supported');
    return this.payments.cancelOrder(id);
  }
}
