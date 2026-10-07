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
  findById(id: string): Promise<OrderDto | null>;
  findByUserId(userId: string): Promise<OrderDto[]>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderDto>;
  save(order: OrderDto): Promise<OrderDto>;
}
