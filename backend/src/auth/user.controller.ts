import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

// Mở rộng ngoài đề §12.1: hồ sơ tối thiểu của người đang đăng nhập (tổng điểm tích lũy)
@Controller('users')
export class UserController {
  constructor(private auth: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return this.auth.profile(req.user.id);
  }
}
