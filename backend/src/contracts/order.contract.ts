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
  /** Idempotency-Key của POST /orders (đề §9 tiêu chí b); không có thì đơn tạo không kèm key. */
  idempotencyKey?: string;
}

export interface IOrderRepository {
  findById(id: string, tx?: TxContext): Promise<OrderDto | null>;
  findByIdempotencyKey(key: string, tx?: TxContext): Promise<OrderDto | null>;
  findByUserId(userId: string, tx?: TxContext): Promise<OrderDto[]>;
  /** Hàng đợi quầy: đơn có trạng thái thuộc `statuses`, cũ trước (FIFO theo createdAt). */
  findByStatuses(statuses: OrderStatus[], tx?: TxContext): Promise<OrderDto[]>;
  updateStatus(id: string, status: OrderStatus, tx?: TxContext): Promise<OrderDto>;
  /** Ném lỗi khi `idempotencyKey` đã có (chỉ số unique), để hai request song song cùng key chỉ tạo 1 đơn. */
  save(order: OrderDto, tx?: TxContext): Promise<OrderDto>;
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}
