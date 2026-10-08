import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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

  // Gap 1: đặt sau 'me' để GET /orders/me không rơi vào :id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  byId(@Param('id') id: string, @Req() req: any) {
    return this.orders.getById(req.user.id, id);
  }
}
