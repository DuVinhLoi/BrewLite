import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthService, Identity } from './auth.service';
export type AuthRequest = Request & { user: Identity };
@Injectable()
export class AuthGuard implements CanActivate {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly auth: AuthService) {}
  /** Xác thực token trong header và gắn danh tính vào request trước khi cho phép truy cập. */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    request.user = this.auth.authenticate(request.headers.authorization);
    return true;
  }
}