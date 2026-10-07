import { IsIn } from 'class-validator';
import { OrderStatus } from '../../contracts/order.contract';

export class UpdateOrderStatusDto {
  @IsIn([OrderStatus.CANCELLED])
  status!: OrderStatus;
}
