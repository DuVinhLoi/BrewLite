import { TxContext } from './transaction.contract';

export type PaymentMethod = 'WALLET' | 'CARD';
export type PaymentStatus = 'SUCCESS';

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
  findByIdempotencyKey(key: string, tx?: TxContext): Promise<PaymentDto | null>;
  findAllByOrderId(orderId: string, tx?: TxContext): Promise<PaymentDto[]>;
  save(payment: PaymentDto, tx?: TxContext): Promise<PaymentDto>;
}
