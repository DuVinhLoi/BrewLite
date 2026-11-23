import { Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthRequest } from '../auth/auth.guard';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../prisma/prisma.service';
import { sizes, toppings } from './pricing';
// First address of x-forwarded-for (Render sits behind a proxy), else 127.0.0.1 (plan 1.1).
/** Tiếp nhận yêu cầu HTTP và Lấy IP đầu tiên từ header proxy; dùng địa chỉ loopback nếu không có thông tin. */
const clientIp = (request: AuthRequest) => {
  const forwarded = request.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() || '127.0.0.1';
};
@Controller()
@UseGuards(AuthGuard)
export class CheckoutController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly checkout: CheckoutService) {}
  /** Tiếp nhận yêu cầu HTTP và tạo đơn cho người dùng đã xác thực. */
  @Post('orders') create(@Req() request: AuthRequest, @Body() body: unknown) { return this.checkout.create(request.user, body); }
  /** Tiếp nhận yêu cầu HTTP và trả danh sách đơn của người dùng hiện tại. */
  @Get('orders/me') list(@Req() request: AuthRequest) { return this.checkout.list(request.user); }
  /** Tiếp nhận yêu cầu HTTP và trả chi tiết đơn sau khi dịch vụ kiểm tra quyền truy cập. */
  @Get('orders/:id') detail(@Req() request: AuthRequest, @Param('id') id: string) { return this.checkout.detail(request.user, id); }
  /** Tiếp nhận yêu cầu HTTP và yêu cầu đổi trạng thái đơn theo vai trò người dùng. */
  @Patch('orders/:id') transition(@Req() request: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.checkout.transition(request.user, id, body); }
  /** Tiếp nhận yêu cầu HTTP và tạo thanh toán; trả HTTP 200 khi dùng lại kết quả, 201 khi tạo mới. */
  @Post('payments') async pay(@Req() request: AuthRequest, @Body() body: unknown, @Headers('idempotency-key') key: string | undefined, @Res({ passthrough: true }) response: Response) {
    const result = await this.checkout.pay(request.user, body, key, clientIp(request));
    response.status(result.replay ? 200 : 201);
    return result.body;
  }
  /** Tiếp nhận yêu cầu HTTP và yêu cầu đồng bộ giao dịch với VNPay. */
  @Post('payments/:id/sync') @HttpCode(200) sync(@Req() request: AuthRequest, @Param('id') id: string) { return this.checkout.sync(request.user, id); }
}
@Controller('catalog/options')
export class OptionsController {
  /** Tiếp nhận yêu cầu HTTP và trả danh sách kích cỡ, topping và phụ phí. */
  @Get() options() { return { sizes, toppings }; }
}
@Controller('health')
export class HealthController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly prisma: PrismaService) {}
  /** Tiếp nhận yêu cầu HTTP và kiểm tra kết nối cơ sở dữ liệu; trả HTTP 503 nếu không truy cập được. */
  @Get() async health(@Res({ passthrough: true }) response: Response) {
    try { await this.prisma.$queryRaw`SELECT 1`; return { status: 'ok', database: 'up' }; }
    catch { response.status(503); return { status: 'error', database: 'down' }; }
  }
}