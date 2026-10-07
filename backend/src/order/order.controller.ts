import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private orders: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.orders.create(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  mine(@Req() req: any) {
    return this.orders.listMine(req.user.id);
  }
}
