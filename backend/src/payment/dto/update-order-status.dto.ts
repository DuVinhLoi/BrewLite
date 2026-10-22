import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../contracts/order.contract';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus', example: OrderStatus.PREPARING })
  @IsIn([OrderStatus.CANCELLED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED])
  status!: OrderStatus;
}
