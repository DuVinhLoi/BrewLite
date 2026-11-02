import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPaymentGatewayService {
  private callCount = 0;

  private failNext = false;

  /** Test-only hook: next charge() throws. */
  failNextCharge(): void {
    this.failNext = true;
  }

  async charge(opts: { amount: number; method: string }): Promise<void> {
    this.callCount++;
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Mock charge failed');
    }
    // Demo thanh toán lỗi: MOCK_GATEWAY_DECLINE_METHOD=CARD|WALLET để luôn từ chối phương thức đó.
    if (process.env.MOCK_GATEWAY_DECLINE_METHOD === opts.method) throw new Error('Mock charge declined');
  }

  async refund(orderId: string, amount: number): Promise<void> {
    this.callCount++;
    this.refunds.push({ orderId, amount });
  }

  /** Sổ hoàn tiền để test kiểm số hoàn đúng số thực thu. */
  readonly refunds: Array<{ orderId: string; amount: number }> = [];

  getCallCount(): number {
    return this.callCount;
  }
}
