import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async create(@Body() dto: CreateOrderDto, @Headers('idempotency-key') key: string | undefined, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const r = await this.orders.create(req.user.id, dto, key);
    res.status(r.isCached ? 200 : 201);
    return r;
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  mine(@Req() req: any) {
    return this.orders.listMine(req.user.id);
  }

  // Gap 1: đặt sau 'me' để GET /orders/me không rơi vào :id
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  byId(@Param('id') id: string, @Req() req: any) {
    return this.orders.getById(req.user.id, id);
  }
}
