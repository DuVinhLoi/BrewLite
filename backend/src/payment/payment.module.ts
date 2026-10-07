import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { InMemoryOrderRepo } from '../stubs/in-memory-order.repo';
import { InMemoryProductRepo } from '../stubs/in-memory-product.repo';
import { InMemoryPaymentRepo } from '../stubs/in-memory-payment.repo';
import { InMemoryUserRepo } from '../stubs/in-memory-user.repo';

@Module({
  controllers: [PaymentController],
  providers: [
    {
      provide: PaymentService,
      useFactory: (o: InMemoryOrderRepo, p: InMemoryProductRepo, pay: InMemoryPaymentRepo, u: InMemoryUserRepo, g: MockPaymentGatewayService) =>
        new PaymentService(o, p, pay, u, g),
      inject: [InMemoryOrderRepo, InMemoryProductRepo, InMemoryPaymentRepo, InMemoryUserRepo, MockPaymentGatewayService],
    },
    MockPaymentGatewayService,
    InMemoryOrderRepo,
    InMemoryProductRepo,
    InMemoryPaymentRepo,
    InMemoryUserRepo,
  ],
})
export class PaymentModule {}
