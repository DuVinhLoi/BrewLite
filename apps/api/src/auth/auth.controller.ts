import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly auth: AuthService) {}
  /** Tiếp nhận yêu cầu HTTP và chuyển dữ liệu đăng ký cho AuthService. */
  @Post('register') register(@Body() body: unknown) { return this.auth.register(body); }
  /** Tiếp nhận yêu cầu HTTP và chuyển dữ liệu đăng nhập cho AuthService. */
  @Post('login') @HttpCode(200) login(@Body() body: unknown) { return this.auth.login(body); }
}