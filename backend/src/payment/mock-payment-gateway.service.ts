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
    // Demo UC06 KB1 không cần sửa code: đặt MOCK_GATEWAY_DECLINE_METHOD=CARD (hoặc WALLET) thì phương thức đó luôn bị từ chối
    if (process.env.MOCK_GATEWAY_DECLINE_METHOD === opts.method) throw new Error('Mock charge declined');
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
