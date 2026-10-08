import { TxContext } from './transaction.contract';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  toppings?: string[];
}

export interface OrderDto {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  items: OrderItemDto[];
  createdAt: Date;
}

export interface IOrderRepository {
  findById(id: string, tx?: TxContext): Promise<OrderDto | null>;
  findByUserId(userId: string, tx?: TxContext): Promise<OrderDto[]>;
  updateStatus(id: string, status: OrderStatus, tx?: TxContext): Promise<OrderDto>;
  save(order: OrderDto, tx?: TxContext): Promise<OrderDto>;
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}
