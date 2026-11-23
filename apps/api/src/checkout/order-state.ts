import { OrderStatus } from '@prisma/client';
const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['PREPARING'], PREPARING: ['READY'], READY: ['COMPLETED'], COMPLETED: [], CANCELLED: [],
};
/** Kiểm tra trạng thái đích có nằm trong các bước chuyển hợp lệ từ trạng thái hiện tại hay không. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean { return transitions[from].includes(to); }