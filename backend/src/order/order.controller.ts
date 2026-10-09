import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from '../contracts/order.contract';
import { Role } from '../contracts/user.contract';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('orders')
export class OrderController {
  constructor(private orders: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.orders.create(req.user.id, dto);
  }

  // UC08: GET /orders?status=PAID,PREPARING,READY — chỉ quầy/quản trị
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARISTA, Role.ADMIN)
  async queue(@Query('status') status?: string) {
    if (!status) return this.orders.listQueue();
    // ?status=A&status=B tới dạng mảng: .split sẽ ném 500, nên báo 400
    if (typeof status !== 'string') throw new BadRequestException('status must be a comma-separated string');
    const list = status.split(',').map((s) => s.trim());
    const bad = list.find((s) => !Object.values(OrderStatus).includes(s as OrderStatus));
    if (bad) throw new BadRequestException(`Unknown status ${bad}`);
    return this.orders.listQueue(list as OrderStatus[]);
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
