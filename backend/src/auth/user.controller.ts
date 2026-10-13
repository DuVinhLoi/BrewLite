import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '../contracts/user.contract';

// Mở rộng ngoài đề §12.1: hồ sơ tối thiểu của người đang đăng nhập (tổng điểm tích lũy)
@Controller('users')
export class UserController {
  constructor(private auth: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  me(@Req() req: any) {
    return this.auth.profile(req.user.id);
  }
}
