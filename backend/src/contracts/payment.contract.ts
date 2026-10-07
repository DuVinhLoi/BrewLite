export type PaymentMethod = 'WALLET' | 'CARD';
export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface PaymentDto {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  discount: number;
  loyaltyPointsEarned: number;
  createdAt: Date;
}

export interface IPaymentRepository {
  findByIdempotencyKey(key: string): Promise<PaymentDto | null>;
  findByOrderId(orderId: string): Promise<PaymentDto | null>;
  save(payment: PaymentDto): Promise<PaymentDto>;
}
