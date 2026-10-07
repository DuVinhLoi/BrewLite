import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPaymentGatewayService {
  private callCount = 0;

  async charge(opts: { amount: number; method: string; shouldSimulateFailure?: boolean }): Promise<void> {
    this.callCount++;
    if (opts.shouldSimulateFailure) throw new Error('Mock charge failed');
  }

  async refund(_orderId: string, _amount: number): Promise<void> {
    this.callCount++;
    this.refunds.push({ orderId: _orderId, amount: _amount });
  }

  /** Sổ hoàn tiền để test UC06 KB3 pin đúng số thực thu. */
  readonly refunds: Array<{ orderId: string; amount: number }> = [];

  getCallCount(): number {
    return this.callCount;
  }
}
