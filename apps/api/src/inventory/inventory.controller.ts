import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthRequest } from '../auth/auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class AvailabilityController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly inventory: InventoryService) {}
  /** Tiếp nhận yêu cầu HTTP và chuyển giỏ hàng cho dịch vụ kiểm tra nguyên liệu khả dụng. */
  @Post('availability') availability(@Body() body: unknown) { return this.inventory.availability(body); }
}

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly inventory: InventoryService) {}
  /** Tiếp nhận yêu cầu HTTP và lấy số dư nguyên liệu theo quyền nhân viên. */
  @Get('ingredients') ingredients(@Req() req: AuthRequest) { return this.inventory.ingredients(req.user); }
  /** Tiếp nhận yêu cầu HTTP và lấy lịch sử biến động kho theo quyền nhân viên. */
  @Get('movements') movements(@Req() req: AuthRequest) { return this.inventory.movements(req.user); }
  /** Tiếp nhận yêu cầu HTTP và ghi nhận nhập kho hoặc kiểm đếm theo quyền nhân viên. */
  @Post('ingredients/:id/movements') move(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.inventory.move(req.user, id, body); }
  /** Tiếp nhận yêu cầu HTTP và lấy các công thức nguyên liệu theo quyền nhân viên. */
  @Get('recipes') recipes(@Req() req: AuthRequest) { return this.inventory.recipes(req.user); }
  /** Tiếp nhận yêu cầu HTTP và lưu công thức nguyên liệu theo quyền nhân viên. */
  @Put('recipes') save(@Req() req: AuthRequest, @Body() body: unknown) { return this.inventory.saveRecipe(req.user, body); }
}
