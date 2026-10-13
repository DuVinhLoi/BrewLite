import { IsIn } from 'class-validator';
import { OrderStatus } from '../../contracts/order.contract';

export class UpdateOrderStatusDto {
  @IsIn([OrderStatus.CANCELLED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED])
  status!: OrderStatus;
}
